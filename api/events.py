import csv
import io
import json
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlsplit
from urllib.request import urlopen
from zoneinfo import ZoneInfo


HEADERS = [
    "Event title", "Start date", "End date", "Event type", "Format", "City",
    "Region / Country", "Venue / platform", "Short description", "Registration URL",
    "Image URL", "Featured?",
]
FEED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRUnbSJeTnlUtPRpEbasYtB-GqeSuNSyYihEb5oRmOZN-B29tBGkX_H2CXH047mvoOuATuRLJOHFk1_/pub?gid=1316402696&single=true&output=csv"
MAX_FEED_BYTES = 512 * 1024


def iso_date(value):
    try:
        return date.fromisoformat(value).isoformat() if value else ""
    except ValueError:
        return ""


def public_url(value):
    try:
        parts = urlsplit(value)
        return value if parts.scheme == "https" and parts.hostname and not parts.username and not parts.password else ""
    except ValueError:
        return ""


def parse_events(feed, today):
    rows = csv.reader(io.StringIO(feed, newline=""), strict=True)
    if next(rows, None) != HEADERS:
        raise ValueError("Unexpected event feed columns")
    events = []
    seen = set()
    for row in rows:
        if not any(row):
            continue
        if len(row) != len(HEADERS):
            raise ValueError("Invalid event feed row")
        title, start, end, kind, format_, city, region, venue, summary, link, image, featured = (
            value.strip() for value in row
        )
        start, end = iso_date(start), iso_date(end)
        end = max(start, end)
        if not title or (end and end < today) or (title, start) in seen:
            continue
        seen.add((title, start))
        events.append({
            "title": title, "start": start, "end": end, "kind": kind, "format": format_,
            "location": ", ".join(dict.fromkeys(part for part in (venue, city, region) if part)),
            "summary": summary, "url": public_url(link), "image": public_url(image),
            "featured": featured.casefold() == "yes",
        })
    return sorted(events, key=lambda event: event["start"] or "9999-12-31")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with urlopen(FEED_URL, timeout=7) as response:
                feed = response.read(MAX_FEED_BYTES + 1)
            if len(feed) > MAX_FEED_BYTES:
                raise ValueError("Event feed exceeds size limit")
            today = datetime.now(ZoneInfo("America/New_York")).date().isoformat()
            events = parse_events(feed.decode("utf-8-sig"), today)
        except (OSError, ValueError, csv.Error) as error:
            print(f"Event feed unavailable: {type(error).__name__}", flush=True)
            self.send_json(502, {"error": "Event feed unavailable"})
            return
        self.send_json(200, {"events": events})

    def send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate" if status == 200 else "no-store")
        if status == 200:
            self.send_header("Vercel-CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=60")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))
