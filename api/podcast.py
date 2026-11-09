import json
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree


SHOW_ID = "1877869"
FEED_URL = f"https://feeds.buzzsprout.com/{SHOW_ID}.rss"
EPISODE_URL = f"https://www.buzzsprout.com/{SHOW_ID}/episodes/"
ITUNES = "{http://www.itunes.com/dtds/podcast-1.0.dtd}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}"
MAX_FEED_BYTES = 12 * 1024 * 1024
EPISODE_COUNT = 6
MAX_GUESTS = 24


def feed_url(url, host, path_prefix="/"):
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    if parts.scheme == "https" and parts.netloc == host and parts.path.startswith(path_prefix):
        return url
    return ""


def parse_podcast(feed, guests=()):
    channel = ElementTree.fromstring(feed).find("channel")
    if channel is None:
        return {"episodes": [], "guestLinks": {}}
    show_image = channel.find(ITUNES + "image")
    default_image = feed_url(show_image.get("href", ""), "storage.buzzsprout.com") if show_image is not None else ""
    now = datetime.now(timezone.utc)
    items = []
    for item in channel.findall("item"):
        title = " ".join(item.findtext("title", "").split())
        episode_id = item.findtext("guid", "").strip().removeprefix("Buzzsprout-")
        try:
            published = parsedate_to_datetime(item.findtext("pubDate", ""))
            published = published.replace(tzinfo=published.tzinfo or timezone.utc)
        except (TypeError, ValueError):
            continue
        if title and episode_id.isascii() and episode_id.isdigit() and published <= now:
            items.append((published, episode_id, title, item))

    items.sort(key=lambda entry: entry[0], reverse=True)
    episodes = []
    guest_links = {}
    seen = set()
    for published, episode_id, title, item in items:
        if episode_id in seen:
            continue
        seen.add(episode_id)
        url = EPISODE_URL + episode_id
        if len(episodes) < EPISODE_COUNT:
            summary = " ".join(unescape(item.findtext(ITUNES + "summary", "")).split())
            if len(summary) > 190:
                summary = summary[:189].rsplit(" ", 1)[0] + "…"
            duration = item.findtext(ITUNES + "duration", "").strip()
            artwork = item.find(ITUNES + "image")
            enclosure = item.find("enclosure")
            image = feed_url(artwork.get("href", ""), "storage.buzzsprout.com") if artwork is not None else ""
            audio = feed_url(enclosure.get("url", ""), "www.buzzsprout.com", f"/{SHOW_ID}/episodes/") if enclosure is not None else ""
            kind = "This Week in Edtech" if title.lower().startswith("week in edtech") else "Deep Dive"
            if " series:" in title.lower():
                kind = title.split(":", 1)[0]
            episodes.append({
                "title": title,
                "date": published.date().isoformat(),
                "url": url,
                "image": image or default_image,
                "audio": audio,
                "minutes": round(int(duration) / 60) if duration.isascii() and duration.isdigit() else 0,
                "summary": summary,
                "kind": kind,
            })

        if len(guest_links) < len(guests):
            text = " ".join((title, item.findtext("description", ""), item.findtext(CONTENT + "encoded", ""))).casefold()
            for guest in guests:
                if guest not in guest_links and guest.casefold() in text:
                    guest_links[guest] = url
        if len(episodes) == EPISODE_COUNT and len(guest_links) == len(guests):
            break

    return {"episodes": episodes, "guestLinks": guest_links}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query = parse_qs(urlsplit(self.path).query, max_num_fields=MAX_GUESTS)
        except ValueError:
            self.send_json(400, {"error": "Invalid podcast feed request"})
            return
        guests = list(dict.fromkeys(name.strip() for name in query.get("guest", []) if 0 < len(name.strip()) <= 80))
        try:
            request = Request(FEED_URL, headers={"User-Agent": "EdtechInsiders/1.0 (public RSS reader)"})
            with urlopen(request, timeout=7) as response:
                feed = response.read(MAX_FEED_BYTES + 1)
            if len(feed) > MAX_FEED_BYTES:
                raise ValueError("Podcast feed exceeds size limit")
            result = parse_podcast(feed, guests)
            if not result["episodes"]:
                raise ValueError("Podcast feed returned no usable episodes")
        except (OSError, ValueError, ElementTree.ParseError) as error:
            print(f"Podcast feed unavailable: {type(error).__name__}", flush=True)
            self.send_json(502, {"error": "Podcast feed temporarily unavailable"})
            return

        self.send_json(200, result)

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate" if status == 200 else "no-store")
        if status == 200:
            self.send_header("Vercel-CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=60, stale-if-error=86400")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))
