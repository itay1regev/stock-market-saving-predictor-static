"""
Builds the S&P 500 and Nasdaq 100 "companies by index weight" snapshots
(public/data/companies/sp500.json and nasdaq100.json).

Sources (each is read once per run):
  - slickcharts.com           weight, price
  - stockanalysis.com         weight, price, daily % change, market cap
  - financhle.com             weight, market cap
  - indexes.nasdaqomx.com     official Nasdaq-100 member list (no weights without a login)

The sites disagree: slickcharts follows the index methodology (the Nasdaq-100 is a
modified-cap index, so its weights differ a lot from plain market-cap shares), while
stockanalysis and financhle report market-cap based shares. The main weight is
slickcharts' (falling back to stockanalysis, then financhle) and every source's figure
is kept in `weights_by_source` for comparison.

Standard library only. Run from the repo root:

    python scripts/generate_us_index_weights.py
"""
from __future__ import annotations

import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "public" / "data" / "companies"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0 Safari/537.36"
)

INDEXES = {
    "sp500": {
        "name": "S&P 500",
        "slickcharts": "https://www.slickcharts.com/sp500",
        "stockanalysis": "https://stockanalysis.com/list/sp-500-stocks/",
        "financhle": "https://financhle.com/sp500-companies-by-weight",
        "nasdaq_official": None,
    },
    "nasdaq100": {
        "name": "Nasdaq 100",
        "slickcharts": "https://www.slickcharts.com/nasdaq100",
        "stockanalysis": "https://stockanalysis.com/list/nasdaq-100-stocks/",
        "financhle": "https://financhle.com/nasdaq100-companies-by-weight",
        "nasdaq_official": "NDX",
    },
}

WEIGHT_PRIORITY = ("slickcharts", "stockanalysis", "financhle")

SOURCE_LABELS = {
    "slickcharts": "slickcharts.com",
    "stockanalysis": "stockanalysis.com",
    "financhle": "financhle.com",
    "nasdaq_official": "indexes.nasdaqomx.com",
}


# ---------------------------------------------------------------- HTTP

def _ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    if sys.platform == "win32":  # pick up certificates added by TLS-inspecting proxies / antivirus
        ctx.load_default_certs()
    return ctx


_CTX = _ssl_context()


def fetch(url: str, data: dict | None = None) -> str:
    body = urllib.parse.urlencode(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    time.sleep(1)
    return text


# ---------------------------------------------------------------- parsing helpers

class _TableParser(HTMLParser):
    """Collects every <table> as a list of rows of cell text."""

    def __init__(self) -> None:
        super().__init__()
        self.tables: list[list[list[str]]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables.append([])
        elif tag == "tr" and self.tables:
            self._row = []
            self.tables[-1].append(self._row)
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(" ".join("".join(self._cell).split()))
            self._cell = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def html_tables(html: str) -> list[list[list[str]]]:
    parser = _TableParser()
    parser.feed(html)
    return parser.tables


def find_table(html: str, required: set[str]) -> tuple[dict[str, int], list[list[str]]]:
    for table in html_tables(html):
        if not table:
            continue
        header = {h: i for i, h in enumerate(table[0])}
        if required <= header.keys():
            return header, table[1:]
    raise ValueError(f"no table with columns {sorted(required)}")


def norm_symbol(symbol: str) -> str:
    return symbol.strip().upper().replace("-", ".").replace("/", ".")


def to_float(text: str | None) -> float | None:
    if text is None:
        return None
    cleaned = re.sub(r"[,$%+\s]", "", str(text))
    if cleaned in ("", "-", "—", "n/a"):
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_cap(text: str) -> float | None:
    """'5.17T' -> 5.17e12"""
    match = re.fullmatch(r"\$?([\d.,]+)\s*([KMBT]?)", text.strip())
    if not match:
        return None
    mult = {"": 1, "K": 1e3, "M": 1e6, "B": 1e9, "T": 1e12}[match.group(2)]
    return float(match.group(1).replace(",", "")) * mult


# ---------------------------------------------------------------- sources

def scrape_slickcharts(url: str) -> dict[str, dict]:
    header, rows = find_table(fetch(url), {"Company", "Symbol", "Weight", "Price"})
    out = {}
    for r in rows:
        sym = norm_symbol(r[header["Symbol"]])
        if sym and sym not in out:
            out[sym] = {
                "name": r[header["Company"]],
                "weight_pct": to_float(r[header["Weight"]]),
                "price": to_float(r[header["Price"]]),
            }
    return out


def scrape_stockanalysis(url: str) -> dict[str, dict]:
    header, rows = find_table(fetch(url), {"Symbol", "Company Name", "Weight", "Market Cap"})
    out = {}
    for r in rows:
        sym = norm_symbol(r[header["Symbol"]])
        out[sym] = {
            "name": r[header["Company Name"]],
            "weight_pct": to_float(r[header["Weight"]]),
            "price": to_float(r[header.get("Stock Price", -1)]) if "Stock Price" in header else None,
            "change_pct": to_float(r[header["% Change"]]) if "% Change" in header else None,
            "market_cap": parse_cap(r[header["Market Cap"]]),
        }
    return out


_FINANCHLE_ROW = re.compile(r"\{[^{}]*\"Symbol\":\"[^\"]+\"[^{}]*\"percentage\":\"[^\"]+\"[^{}]*\}")


def scrape_financhle(url: str) -> dict[str, dict]:
    # The full list is embedded as JSON in the Next.js payload (the HTML table shows only the top 30).
    text = fetch(url).replace('\\"', '"')
    out = {}
    for match in _FINANCHLE_ROW.finditer(text):
        try:
            row = json.loads(match.group(0))
        except json.JSONDecodeError:
            continue
        sym = norm_symbol(row["Symbol"])
        if sym in out:
            continue
        out[sym] = {
            "name": row.get("Company"),
            "weight_pct": to_float(row.get("percentage")),
            "price": to_float(row.get("Price")),
            "market_cap": to_float(row.get("MarketCap")),
        }
    if not out:
        raise ValueError("financhle: no embedded rows found")
    return out


def scrape_nasdaq_members(index_id: str) -> set[str]:
    payload = fetch(
        "https://indexes.nasdaqomx.com/Index/WeightingData",
        {"id": index_id, "tradeDate": f"{date.today().isoformat()}T00:00:00.000", "timeOfDay": "SOD"},
    )
    return {norm_symbol(r["Symbol"]) for r in json.loads(payload).get("aaData", [])}


# ---------------------------------------------------------------- build

def fmt_pct(value: float | None, digits: int = 2) -> str:
    return "—" if value is None else f"{value:.{digits}f}%"


def fmt_signed_pct(value: float | None) -> str:
    return "—" if value is None else f"{value:+.2f}%"


def fmt_price(value: float | None) -> str:
    return "—" if value is None else f"${value:,.2f}"


def fmt_cap(value: float | None) -> str:
    if value is None:
        return "—"
    for div, suffix in ((1e12, "T"), (1e9, "B"), (1e6, "M")):
        if value >= div:
            return f"${value / div:,.2f}{suffix}"
    return f"${value:,.0f}"


def build_index(key: str, cfg: dict) -> dict:
    print(f"{cfg['name']}...")
    sources: dict[str, dict[str, dict]] = {}
    for src in ("slickcharts", "stockanalysis", "financhle"):
        try:
            sources[src] = globals()[f"scrape_{src}"](cfg[src])
            print(f"  {src}: {len(sources[src])} rows")
        except Exception as exc:  # keep going with whatever sources answered
            print(f"  {src}: FAILED ({exc})")

    official: set[str] | None = None
    if cfg["nasdaq_official"]:
        try:
            official = scrape_nasdaq_members(cfg["nasdaq_official"])
            print(f"  nasdaq_official: {len(official)} members")
        except Exception as exc:
            print(f"  nasdaq_official: FAILED ({exc})")
        if official is not None and not official:
            official = None

    if not sources:
        raise RuntimeError(f"{cfg['name']}: every source failed")

    # Membership: the official list when there is one, otherwise symbols listed by at least two sources
    # (or by the only source that answered).
    counts: dict[str, int] = {}
    for rows in sources.values():
        for sym in rows:
            counts[sym] = counts.get(sym, 0) + 1
    if official:
        members = official
    else:
        members = {s for s, n in counts.items() if n >= min(2, len(sources))}

    companies = []
    for sym in members:
        per = {src: rows.get(sym) for src, rows in sources.items()}
        weights = {src: r["weight_pct"] for src, r in per.items() if r and r.get("weight_pct") is not None}
        sa, sc, fi = per.get("stockanalysis"), per.get("slickcharts"), per.get("financhle")
        name = next((r["name"] for r in (sa, sc, fi) if r and r.get("name")), sym)
        price = next((r["price"] for r in (sa, sc, fi) if r and r.get("price") is not None), None)
        cap = next((r["market_cap"] for r in (sa, fi) if r and r.get("market_cap") is not None), None)
        change = sa.get("change_pct") if sa else None
        weight_source = next((src for src in WEIGHT_PRIORITY if src in weights), None)
        weight = weights[weight_source] if weight_source else None
        companies.append({
            "symbol": sym,
            "name": name,
            "weight_pct": weight,
            "weight_source": weight_source,
            "weights_by_source": {src: weights.get(src) for src in sources},
            "price": price,
            "change_pct": change,
            "market_cap": cap,
            "display_weight_pct": fmt_pct(weight),
            "display_price": fmt_price(price),
            "display_change_pct": fmt_signed_pct(change),
            "display_market_cap": fmt_cap(cap),
        })

    companies.sort(key=lambda c: (c["weight_pct"] is None, -(c["weight_pct"] or 0), c["symbol"]))
    for rank, c in enumerate(companies, 1):
        c["rank"] = rank

    missing = sorted(s for s in members if not any(s in rows for rows in sources.values()))
    if missing:
        print(f"  warning: official members missing from every weight source: {', '.join(missing)}")

    return {
        "index": key,
        "index_name": cfg["name"],
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "sources": [
            {"id": src, "label": SOURCE_LABELS[src], "url": cfg[src]}
            for src in sources
        ] + ([{"id": "nasdaq_official", "label": SOURCE_LABELS["nasdaq_official"],
               "url": f"https://indexes.nasdaqomx.com/Index/Weighting/{cfg['nasdaq_official']}/"}]
             if official else []),
        "companies": companies,
    }


def main(argv: list[str]) -> int:
    keys = argv or list(INDEXES)
    for key in keys:
        payload = build_index(key, INDEXES[key])
        path = DATA_DIR / f"{key}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  wrote {path} ({len(payload['companies'])} companies)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
