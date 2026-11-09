import json
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree


PUBLICATION = "edtechinsiders.substack.com"
FEED_URL = f"https://{PUBLICATION}/feed"
IMAGE_HOSTS = {"substackcdn.com", "substack-post-media.s3.amazonaws.com"}
MAX_FEED_BYTES = 4 * 1024 * 1024
STORY_COUNT = 9


def story_image(item):
    enclosure = item.find("enclosure")
    if enclosure is None or not enclosure.get("type", "").startswith("image/"):
        return ""
    url = enclosure.get("url", "")
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    if parts.scheme != "https" or parts.netloc not in IMAGE_HOSTS:
        return ""
    if parts.netloc == "substackcdn.com" and parts.path.startswith("/image/fetch/"):
        _, separator, source = parts.path.removeprefix("/image/fetch/").partition("/")
        if separator and source:
            return f"https://substackcdn.com/image/fetch/w_1000,c_limit,f_auto,q_auto:good/{source}"
    return url


def parse_stories(feed):
    root = ElementTree.fromstring(feed)
    now = datetime.now(timezone.utc)
    dated_stories = []

    for item in root.findall("./channel/item"):
        title = " ".join(item.findtext("title", "").split())
        try:
            link = urlsplit(item.findtext("link", "").strip())
            published = parsedate_to_datetime(item.findtext("pubDate", ""))
            published = published.replace(tzinfo=published.tzinfo or timezone.utc)
        except (TypeError, ValueError):
            continue
        if not title or published > now:
            continue
        path = link.path.rstrip("/")
        if link.scheme != "https" or link.netloc != PUBLICATION or not path.startswith("/p/"):
            continue

        summary = " ".join(item.findtext("description", "").split())
        if len(summary) > 220:
            summary = summary[:219].rsplit(" ", 1)[0] + "…"
        dated_stories.append((published, {
            "title": title,
            "url": f"https://{PUBLICATION}{path}",
            "date": published.astimezone(timezone.utc).date().isoformat(),
            "summary": summary,
            "image": story_image(item),
        }))

    dated_stories.sort(key=lambda entry: entry[0], reverse=True)
    unique_stories = {}
    for _, story in dated_stories:
        unique_stories.setdefault(story["url"], story)
    return list(unique_stories.values())[:STORY_COUNT]


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            request = Request(FEED_URL, headers={
                "Accept": "application/rss+xml, application/xml",
                "User-Agent": "EdtechInsiders/1.0 (public RSS reader)",
            })
            with urlopen(request, timeout=5) as response:
                feed = response.read(MAX_FEED_BYTES + 1)
            if len(feed) > MAX_FEED_BYTES:
                raise ValueError("Substack feed exceeds size limit")
            stories = parse_stories(feed)
            if not stories:
                raise ValueError("Substack feed returned no usable stories")
        except (OSError, ValueError, ElementTree.ParseError) as error:
            print(f"Newsletter feed unavailable: {type(error).__name__}", flush=True)
            self.send_json(502, {"error": "Newsletter feed temporarily unavailable"})
            return

        self.send_json(200, {"stories": stories})

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate" if status == 200 else "no-store")
        if status == 200:
            self.send_header("Vercel-CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=60, stale-if-error=86400")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))
