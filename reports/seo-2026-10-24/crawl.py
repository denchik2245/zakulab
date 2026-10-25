"""Read-only SEO crawl. Saves public response evidence without submitting forms."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

BASE = "https://zakulab.ru"
OUT = Path(__file__).resolve().parent
UA = "Mozilla/5.0 (compatible; ZakulabSEOAudit/1.0; read-only)"


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.images, self.headings, self.structured = [], [], [], [], []
        self.ids, self.assets, self.text, self.main_text = set(), set(), [], []
        self.title_parts, self.title, self.lang = [], False, ""
        self.h, self.hparts, self.anchor, self.script, self.script_parts = None, [], None, None, []
        self.skip, self.in_main = 0, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "html": self.lang = a.get("lang", "")
        if tag == "main": self.in_main = True
        if tag == "title": self.title = True
        if tag == "meta": self.meta.append(a)
        if tag == "link":
            self.links.append({**a, "tag": "link"})
            if any(x in a.get("rel", "") for x in ["stylesheet", "icon"]):
                if a.get("href"): self.assets.add(a["href"])
        if tag == "a":
            self.anchor = {**a, "tag": "a", "text_parts": []}
            self.links.append(self.anchor)
        if tag == "img":
            self.images.append(a)
            if a.get("src"): self.assets.add(a["src"])
            if self.anchor and a.get("alt"): self.anchor["text_parts"].append(a["alt"])
        if re.fullmatch(r"h[1-6]", tag): self.h, self.hparts = tag, []
        if tag in ("script", "style", "template"):
            self.skip += 1
            if tag == "script":
                self.script, self.script_parts = a.get("type", ""), []
                if a.get("src"): self.assets.add(a["src"])

    def handle_endtag(self, tag):
        if tag == "title": self.title = False
        if tag == "main": self.in_main = False
        if tag == "a": self.anchor = None
        if tag == self.h:
            self.headings.append({"level": self.h, "text": " ".join(" ".join(self.hparts).split())})
            self.h = None
        if tag in ("script", "style", "template"):
            self.skip = max(0, self.skip - 1)
            if tag == "script" and self.script == "application/ld+json":
                raw = "".join(self.script_parts)
                try: self.structured.append({"valid_json": True, "data": json.loads(raw)})
                except ValueError as exc: self.structured.append({"valid_json": False, "error": str(exc), "raw": raw})
            if tag == "script": self.script = None

    def handle_data(self, data):
        if self.title: self.title_parts.append(data)
        if self.script == "application/ld+json": self.script_parts.append(data)
        if self.skip: return
        if self.h: self.hparts.append(data)
        if self.anchor: self.anchor["text_parts"].append(data)
        if data.strip():
            self.text.append(data)
            if self.in_main: self.main_text.append(data)


def fetch(url):
    start = time.perf_counter()
    try:
        try:
            response = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=25)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            body = response.read()
            return {"url": url, "final_url": response.url, "status": response.status,
                    "headers": dict(response.headers), "elapsed_s": round(time.perf_counter() - start, 3),
                    "bytes": len(body), "body": body.decode("utf-8", errors="replace")}
    except Exception as exc:
        return {"url": url, "error": str(exc), "elapsed_s": round(time.perf_counter() - start, 3)}


def summary(result):
    return {k: v for k, v in result.items() if k != "body"}


def main():
    (OUT / "html").mkdir(exist_ok=True)
    robots = fetch(BASE + "/robots.txt")
    sitemap = fetch(BASE + "/sitemap.xml")
    (OUT / "robots.txt").write_text(robots.get("body", ""), encoding="utf-8")
    (OUT / "sitemap.xml").write_text(sitemap.get("body", ""), encoding="utf-8")
    sitemap_urls = []
    try:
        root = ET.fromstring(sitemap.get("body", ""))
        sitemap_urls = [e.text for e in root.iter() if e.tag.endswith("}loc") and e.text]
    except ET.ParseError: pass
    pending = list(dict.fromkeys([BASE + "/", *sitemap_urls, *[BASE + p for p in [
        "/projects", "/reviews", "/style-check", "/privacy", "/consent", "/success",
        "/success?form=review", "/request", "/seo-audit-missing-page-20261023",
        "/cases/alts", "/cases/ashanti", "/cases/seo-roi", "/cases/seo-audit-missing-case"]]]))
    seen, pages = set(), []
    while pending and len(seen) < 100:
        batch = [u for u in pending if u not in seen]
        pending = []
        seen.update(batch)
        with ThreadPoolExecutor(max_workers=3) as pool:
            results = list(pool.map(fetch, batch))
        for result in results:
            if "body" not in result:
                pages.append(result)
                continue
            body = result.pop("body")
            p = Page()
            p.feed(body)
            filename = hashlib.sha256(result["url"].encode()).hexdigest()[:12] + ".html"
            (OUT / "html" / filename).write_text(body, encoding="utf-8")
            for link in p.links:
                if "text_parts" in link:
                    link["text"] = " ".join(" ".join(link.pop("text_parts")).split())
                if link.get("tag") != "a": continue
                absolute = urllib.parse.urljoin(result["final_url"], link.get("href", ""))
                target = urllib.parse.urlsplit(absolute)
                if target.netloc == "zakulab.ru" and not target.path.startswith(("/api/", "/_next/", "/admin", "/page-cache/")):
                    normalized = urllib.parse.urlunsplit((target.scheme, target.netloc, target.path or "/", target.query, ""))
                    if normalized not in seen and normalized not in pending: pending.append(normalized)
            main_copy = " ".join(" ".join(p.main_text).split())
            pages.append({**result, "html_file": "html/" + filename,
                "title": "".join(p.title_parts), "lang": p.lang, "meta": p.meta,
                "headings": p.headings, "links": p.links, "images": p.images,
                "structured_data": p.structured, "ids": sorted(p.ids), "assets": sorted(p.assets),
                "main_words": len(re.findall(r"\w+", main_copy)), "main_text": main_copy,
                "all_text": " ".join(" ".join(p.text).split())})
    checks = ["http://zakulab.ru/", "https://www.zakulab.ru/", "http://www.zakulab.ru/",
              "https://zakulab.netlify.app/", "https://zakulab.netlify.app/projects",
              BASE + "/projects/", BASE + "/?utm_source=seo-audit", BASE + "/opengraph-image"]
    with ThreadPoolExecutor(max_workers=3) as pool:
        variants = [summary(r) for r in pool.map(fetch, checks)]
    asset_urls = set()
    for page in pages:
        for asset in page.get("assets", []):
            absolute = urllib.parse.urljoin(page["url"], asset)
            if urllib.parse.urlsplit(absolute).netloc == "zakulab.ru": asset_urls.add(absolute)
    with ThreadPoolExecutor(max_workers=4) as pool:
        assets = [summary(r) for r in pool.map(fetch, sorted(asset_urls))]
    report = {"timestamp_utc": datetime.now(timezone.utc).isoformat(), "base": BASE,
              "robots_response": summary(robots), "sitemap_response": summary(sitemap),
              "sitemap_urls": sitemap_urls, "pages": pages, "url_variants": variants, "assets": assets}
    (OUT / "crawl.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"pages": [{"url": p["url"], "status": p.get("status"), "title": p.get("title"),
          "h1": [h["text"] for h in p.get("headings", []) if h["level"] == "h1"],
          "main_words": p.get("main_words"), "error": p.get("error")} for p in pages],
          "sitemap_urls": sitemap_urls, "variants": variants, "asset_count": len(assets),
          "bad_assets": [a for a in assets if a.get("status") != 200]}, ensure_ascii=False, indent=2))


if __name__ == "__main__": main()
