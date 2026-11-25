"""
Generates the static JSON snapshots that static_version/src consumes instead
of calling the live backend API. Imports backend/app/* purely as a library
(read-only) -- this script never modifies any file under backend/ or
frontend/, and is safe to re-run any time to refresh the snapshots.

Run with the backend's existing Linux venv, from the backend/ directory:

    cd backend && .venv_linux/bin/python ../static_version/scripts/generate_static_data.py
"""
import json
import os
import shutil
import sys
from dataclasses import replace
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, os.getcwd())  # backend/ -- so `import app...` resolves

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "static_version" / "public" / "data"
IMAGES_DIR = REPO_ROOT / "static_version" / "public" / "content-images"


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  wrote {path.relative_to(REPO_ROOT)}")


def gen_backtest_scenarios():
    from app.schemas.backtest import BacktestResponse
    from app.services.backtest import ASSETS, run_backtest

    print("Backtest scenarios...")
    end = date.today()
    start = end - timedelta(days=365.25 * 10)

    styles = {
        "lump_sum": {"initial_amount": 10000.0, "contribution_amount": 0.0, "contribution_frequency": "none",
                     "label": "Lump sum -- $10,000 upfront, no contributions"},
        "monthly_dca": {"initial_amount": 0.0, "contribution_amount": 500.0, "contribution_frequency": "monthly",
                         "label": "Monthly DCA -- $500/month, no upfront"},
        "combo": {"initial_amount": 10000.0, "contribution_amount": 500.0, "contribution_frequency": "monthly",
                  "label": "Lump sum + DCA -- $10,000 upfront + $500/month"},
    }

    scenarios = {}
    for asset_key in ASSETS:
        for style_key, style in styles.items():
            scenario_id = f"{asset_key}__{style_key}"
            result = run_backtest(
                initial_amount=style["initial_amount"],
                contribution_amount=style["contribution_amount"],
                contribution_frequency=style["contribution_frequency"],
                start=start,
                end=end,
                asset=asset_key,
            )
            payload = json.loads(BacktestResponse.model_validate(result).model_dump_json())
            payload["scenario_id"] = scenario_id
            payload["scenario_label"] = f"{result.asset_label} -- {style['label']}"
            scenarios[scenario_id] = payload
            print(f"  computed {scenario_id}: end_balance={result.end_balance:.2f}")

    write_json(DATA_DIR / "backtest-scenarios.json", scenarios)


def gen_etfs():
    from app.schemas.etf import EtfsResponse
    from app.services import etf as etf_service

    print("ETFs...")
    variants = {
        "sp500": etf_service.get_sp500_etfs,
        "msci-world": etf_service.get_msci_world_etfs,
        "nasdaq100": etf_service.get_nasdaq100_etfs,
        "bond": etf_service.get_bond_etfs,
        "israel-sp500": etf_service.get_israel_sp500_etfs,
        "israel-nasdaq100": etf_service.get_israel_nasdaq100_etfs,
        "israel-msci-world": etf_service.get_israel_msci_world_etfs,
        "israel-ta125": etf_service.get_israel_ta125_etfs,
        "ishares-tase": etf_service.get_ishares_tase_etfs,
        "sector-exposure": etf_service.get_israel_sector_etfs,
    }
    for variant, fn in variants.items():
        payload = json.loads(EtfsResponse(etfs=fn()).model_dump_json())
        write_json(DATA_DIR / "etfs" / f"{variant}.json", payload)


def gen_indicators():
    from app.schemas.indicators import IndicatorsResponse, IndicatorYearlySeriesOut
    from app.services.indicators import COUNTRY_INDICATORS, COUNTRY_LABELS, get_country_indicators, get_indicator_yearly_series

    print("Indicators...")
    for country in COUNTRY_LABELS:
        indicators = get_country_indicators(country)
        response = IndicatorsResponse(country=country, country_label=COUNTRY_LABELS[country], indicators=indicators)
        write_json(DATA_DIR / "indicators" / f"{country}.json", json.loads(response.model_dump_json()))

        for defn in COUNTRY_INDICATORS[country]:
            try:
                series = get_indicator_yearly_series(country, defn.key)
            except Exception as exc:
                print(f"  SKIP {country}/{defn.key}: {exc}")
                continue
            payload = json.loads(IndicatorYearlySeriesOut.model_validate(series).model_dump_json())
            write_json(DATA_DIR / "indicators" / country / f"{defn.key}-yearly.json", payload)


def gen_companies():
    from app.schemas.company_detail import CompanyDetailOut
    from app.schemas.index_composition import CompaniesResponse
    from app.services.company_detail import get_company_detail
    from app.services.index_composition import get_ta125_companies
    from app.services.saved_stocks import to_company_out

    print("TA-125 companies...")
    companies = get_ta125_companies()
    response = CompaniesResponse(companies=[to_company_out(c, set()) for c in companies])
    write_json(DATA_DIR / "companies" / "ta125.json", json.loads(response.model_dump_json()))

    for c in companies:
        detail = get_company_detail(c.security_id)
        if detail is None:
            continue
        payload = json.loads(CompanyDetailOut.model_validate(replace(detail, is_saved=False)).model_dump_json())
        write_json(DATA_DIR / "companies" / "ta125" / f"{c.security_id}.json", payload)


def gen_fund_exposure():
    from app.schemas.fund_exposure import FundHoldingsResponse
    from app.services.fund_exposure import get_mor_ta125_holdings, get_yalin_lapidot_ta125_value_holdings

    print("Fund exposure...")
    funds = {
        "mor-israel-ta125": get_mor_ta125_holdings,
        "yalin-lapidot-ta125-value": get_yalin_lapidot_ta125_value_holdings,
    }
    for fund_key, fn in funds.items():
        payload = json.loads(FundHoldingsResponse(holdings=fn()).model_dump_json())
        write_json(DATA_DIR / "fund-exposure" / f"{fund_key}.json", payload)


def gen_reit_stocks():
    from app.schemas.company_detail import CompanyDetailOut
    from app.schemas.reit_stock import ReitStockDetailOut, ReitStocksResponse
    from app.services.reit_stocks import get_reit_companies, get_reit_stock_detail
    from app.services.saved_stocks import to_company_out

    print("REIT stocks...")
    companies = get_reit_companies()
    response = ReitStocksResponse(stocks=[to_company_out(c, set()) for c in companies])
    write_json(DATA_DIR / "reit-stocks" / "list.json", json.loads(response.model_dump_json()))

    for c in companies:
        reit_detail = get_reit_stock_detail(c.security_id)
        if reit_detail is None:
            continue
        out = ReitStockDetailOut(
            security_id=reit_detail.security_id,
            company=to_company_out(reit_detail.company, set()),
            detail=CompanyDetailOut.model_validate(replace(reit_detail.detail, is_saved=False)),
            source=reit_detail.source,
            years=reit_detail.years,
        )
        write_json(DATA_DIR / "reit-stocks" / f"{c.security_id}.json", json.loads(out.model_dump_json()))


def gen_blog_posts():
    from app.content.markdown_loader import CONTENT_DIR, load_posts

    print("Blog posts...")
    posts = load_posts()
    payload = [
        {
            "id": i + 1,
            "title": p.title,
            "slug": p.slug,
            "content": p.body,
            "summary": p.excerpt,
            "category": p.category,
            "cover_image": p.cover_image,
            "author": "Staff Writer",
            "published_at": p.date.isoformat(),
            "is_saved": False,
        }
        for i, p in enumerate(sorted(posts, key=lambda p: p.date, reverse=True))
    ]
    write_json(DATA_DIR / "blog-posts.json", payload)

    src_images = CONTENT_DIR / "images"
    if src_images.exists():
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        for svg in src_images.glob("*.svg"):
            shutil.copy(svg, IMAGES_DIR / svg.name)
        print(f"  copied {len(list(src_images.glob('*.svg')))} cover images -> {IMAGES_DIR.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    gen_backtest_scenarios()
    gen_etfs()
    gen_indicators()
    gen_companies()
    gen_fund_exposure()
    gen_reit_stocks()
    gen_blog_posts()
    print("Done.")
