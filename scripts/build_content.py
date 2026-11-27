"""
Builds the site's editorial JSON from the Markdown sources in data/Content.

    data/Content/news/*.md               -> public/data/news-posts.json
    data/Content/news/images/*.svg       -> public/content-images/
    data/Content/how-to-invest/hub.json  -> public/data/how-to-invest.json
    data/Content/how-to-invest/<topic>/*.md  (merged into the same file)

Standard library only. Run from the repo root:

    python scripts/build_content.py

Front matter is a small YAML subset: `key: value` lines (values may be
double-quoted JSON-style strings, true/false or integers) and `key:` followed
by `  - item` list lines.
"""
from __future__ import annotations

import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "data" / "Content"
OUT_DATA = ROOT / "public" / "data"
OUT_IMAGES = ROOT / "public" / "content-images"

# Must match NEWS_SECTIONS in src/content/news.ts. A post with any other
# category would show in Top Stories but in no section, so it fails the build.
NEWS_CATEGORIES = {
    "Markets",
    "Company News",
    "Economy",
    "Personal Finance",
    "Crypto",
    "Investing Gurus",
    "Explainers",
}

# Social-media extras some source files carry. They stay in the Markdown but
# are not published on the site.
VIDEO_PROMPT = re.compile(r"\n(?:---\s*\n+)?\*\*\s*🎬\s*Video prompt.*\Z", re.S)
HASHTAG_LINE = re.compile(r"^\s*#[A-Za-z]\w*(?:\s+#[A-Za-z]\w*)*\s*$")


def tidy_text(text: str) -> str:
    """ASCII double hyphens between words -> em dash."""
    return re.sub(r"\s+--\s+", " — ", text)


def clean_news_body(body: str) -> str:
    body = VIDEO_PROMPT.sub("\n", body)
    lines = [ln for ln in body.split("\n") if not HASHTAG_LINE.match(ln)]
    body = "\n".join(lines).rstrip()
    # Drop a horizontal rule left dangling at the very end.
    body = re.sub(r"\n+---\s*\Z", "", body).rstrip()
    return tidy_text(body) + "\n"


def parse_scalar(raw: str):
    raw = raw.strip()
    if raw.startswith('"') and raw.endswith('"'):
        return json.loads(raw)
    if raw.startswith("'") and raw.endswith("'"):
        return raw[1:-1].replace("''", "'")
    if raw in ("true", "false"):
        return raw == "true"
    if raw.isdigit():
        return int(raw)
    return raw


def read_markdown(path: Path) -> tuple[dict, str]:
    # utf-8-sig tolerates the BOM some Windows editors add.
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    if not text.endswith("\n"):
        text += "\n"
    if not text.startswith("---\n") or "\n---\n" not in text[3:]:
        raise ValueError(f"{path.name}: missing or unterminated front matter")
    end = text.index("\n---\n", 3)
    meta: dict = {}
    current_list: str | None = None
    for line in text[4:end].split("\n"):
        if not line.strip():
            continue
        if line.startswith("  - ") and current_list:
            meta[current_list].append(parse_scalar(line[4:]))
            continue
        key, sep, value = line.partition(":")
        key = key.strip()
        if not sep or not key:
            raise ValueError(f"{path.name}: bad front matter line: {line!r}")
        if value.strip() == "":
            meta[key] = []
            current_list = key
        else:
            meta[key] = parse_scalar(value)
            current_list = None
    body = text[end + len("\n---\n"):].strip("\n") + "\n"
    return meta, body


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def build_news() -> None:
    print("News...")
    src = CONTENT / "news"
    posts = []
    for md in sorted(src.glob("*.md")):
        try:
            meta, body = read_markdown(md)
            category = meta.get("category")
            if category not in NEWS_CATEGORIES:
                raise ValueError(f"category {category!r} is not one of {sorted(NEWS_CATEGORIES)}")
            published = date.fromisoformat(str(meta["date"])[:10])
            cover = meta.get("cover_image")
            if cover and not (src / "images" / Path(cover).name).exists():
                raise ValueError(f"cover image {cover!r} not found in {src / 'images'}")
            posts.append(
                {
                    "title": tidy_text(meta["title"]),
                    "slug": meta.get("slug") or md.stem,
                    "content": clean_news_body(body),
                    "summary": tidy_text(meta.get("excerpt", "")),
                    "category": category,
                    "cover_image": cover,
                    "author": meta.get("author", "Staff Writer"),
                    "published_at": f"{published.isoformat()}T00:00:00",
                }
            )
        except (KeyError, ValueError) as exc:
            raise SystemExit(f"{md.name}: {exc!r}") from exc
    slugs = [p["slug"] for p in posts]
    dupes = sorted({s for s in slugs if slugs.count(s) > 1})
    if dupes:
        raise SystemExit(f"Duplicate news slugs: {dupes}")
    posts.sort(key=lambda p: (p["published_at"], p["slug"]), reverse=True)
    for i, p in enumerate(posts):
        p["id"] = i + 1
    write_json(OUT_DATA / "news-posts.json", posts)

    images = src / "images"
    if images.exists():
        OUT_IMAGES.mkdir(parents=True, exist_ok=True)
        files = [f for f in images.iterdir() if f.suffix.lower() in {".svg", ".png", ".jpg", ".jpeg", ".webp"}]
        for f in files:
            shutil.copy(f, OUT_IMAGES / f.name)
        print(f"  copied {len(files)} cover images -> {OUT_IMAGES.relative_to(ROOT)}")


def build_how_to_invest() -> None:
    print("How to Invest...")
    src = CONTENT / "how-to-invest"
    hub = json.loads((src / "hub.json").read_text(encoding="utf-8"))
    topic_ids = [t["id"] for t in hub["topics"]]
    articles = []
    for topic_id in topic_ids:
        for md in sorted((src / topic_id).glob("*.md")):
            meta, body = read_markdown(md)
            articles.append(
                {
                    "slug": meta.get("slug") or md.stem,
                    "title": meta["title"],
                    "topic": meta.get("topic", topic_id),
                    "level": meta.get("level", "Beginner"),
                    "readMinutes": meta.get("read_minutes", 5),
                    "featured": bool(meta.get("featured", False)),
                    "order": meta.get("order", 100),
                    "summary": meta.get("summary", ""),
                    "takeaways": meta.get("takeaways", []),
                    "body": body,
                }
            )
    articles.sort(key=lambda a: (topic_ids.index(a["topic"]), a["order"], a["slug"]))
    slugs = {a["slug"] for a in articles}
    missing = [s for s in hub["start_here"] if s not in slugs]
    if missing:
        raise ValueError(f"hub.json start_here references unknown slugs: {missing}")
    write_json(OUT_DATA / "how-to-invest.json", {**hub, "articles": articles})


if __name__ == "__main__":
    build_news()
    build_how_to_invest()
    print("Done.")
