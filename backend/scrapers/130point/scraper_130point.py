#!/usr/bin/env python3
"""
130Point backend comps scraper

Fetches sales comps from https://back.130point.com/sales/ by reproducing the
browser's POST request, then parses the returned HTML into structured records.

Usage:
  python scraper_130point.py --query "rolex watch" --type 2 --subcat -1 --tab-id 7 \
    --tz America/New_York --sort urlEndTimeSoonest --csv comps.csv --json comps.json

Notes:
- This hits the backend host (back.130point.com), which is separate from the frontend.
- The endpoint currently returns HTML fragments. We parse rows like <tr id="dRow" ...>.
- Fields extracted: title, link, sale_price, currency, best_offer_price, list_price,
  current_price, bids, sale_type, date_text, image_thumb, image_large, source ("eBay" etc.).
- Respects CORS=* and requires no auth as of the time of writing.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any

import requests
from bs4 import BeautifulSoup

BACKEND_URL = "https://back.130point.com/sales/"

DEFAULT_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://130point.com",
    "Referer": "https://130point.com/",
    # Keep UA pretty standard; customize if you like.
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class CompRow:
    title: Optional[str] = None
    link: Optional[str] = None
    sale_price: Optional[float] = None
    currency: Optional[str] = None
    best_offer_price: Optional[float] = None
    list_price: Optional[float] = None
    current_price: Optional[float] = None
    bids: Optional[int] = None
    sale_type: Optional[str] = None
    date_text: Optional[str] = None  # raw, e.g., "Mon 10 Nov 2025 17:52:42 EST"
    shipping: Optional[str] = None
    image_thumb: Optional[str] = None
    image_large: Optional[str] = None
    source: Optional[str] = None  # e.g. "eBay"


def _clean_money(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    # keep digits, dot; handle thousands separators/whitespace
    s = s.replace(",", "").strip()
    m = re.search(r"([0-9]+(?:\.[0-9]+)?)", s)
    return float(m.group(1)) if m else None


def _clean_int(s: Optional[str]) -> Optional[int]:
    if not s:
        return None
    m = re.search(r"(\d+)", s.replace(",", ""))
    return int(m.group(1)) if m else None


def fetch_html(
    query: str,
    type_: int = 2,
    subcat: int = -1,
    tab_id: int = 7,
    tz: str = "America/New_York",
    sort: str = "urlEndTimeSoonest",
    extra_params: Optional[Dict[str, Any]] = None,
    timeout: float = 30.0,
    retries: int = 3,
    backoff: float = 1.5,
    session: Optional[requests.Session] = None,
) -> str:
    data = {
        "query": query,
        "type": str(type_),
        "subcat": str(subcat),
        "tab_id": str(tab_id),
        "tz": tz,
        "sort": sort,
    }
    if extra_params:
        data.update({k: str(v) for k, v in extra_params.items()})

    sess = session or requests.Session()

    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            resp = sess.post(BACKEND_URL, data=data, headers=DEFAULT_HEADERS, timeout=timeout)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            last_exc = e
            if attempt == retries:
                break
            sleep_s = backoff ** attempt
            time.sleep(sleep_s)
    raise RuntimeError(f"Failed to fetch after {retries} attempts: {last_exc}")


def parse_comps(html: str) -> List[CompRow]:
    soup = BeautifulSoup(html, "html.parser")
    out: List[CompRow] = []

    # Each result row appears to be <tr id="dRow" ...>
    for row in soup.select("tr#dRow"):
        comp = CompRow()

        # Data attributes (price, currency) available on the <tr> or a hidden div
        comp.sale_price = _clean_money(row.get("data-price"))
        comp.currency = row.get("data-currency")

        # Title + link
        title_a = row.select_one("span#titleText a")
        if title_a:
            comp.title = title_a.get_text(strip=True)
            comp.link = title_a.get("href")

        # Sale type (e.g., "Fixed Price", "Best Offer Accepted", "auction")
        sale_type_span = row.select_one("span#auctionLabel")
        comp.sale_type = sale_type_span.get_text(strip=True) if sale_type_span else None

        # Date
        date_span = row.select_one("span#dateText")
        if date_span:
            # common format: "Date: Mon 10 Nov 2025 17:52:42 EST"
            date_txt = date_span.get_text(" ", strip=True)
            comp.date_text = re.sub(r"^Date:\s*", "", date_txt, flags=re.I)

        # Shipping (if present)
        ship_span = row.select_one("span#shipString")
        if ship_span:
            ship_txt = ship_span.get_text(" ", strip=True)
            comp.shipping = re.sub(r"^Shipping Price:\s*", "", ship_txt, flags=re.I)

        # Source (eBay badge nearby)
        # The markup shows a stylized "eBay". We'll capture the literal text nearby.
        source_container = row.select_one("#ebayOuter")
        if source_container:
            comp.source = "eBay"
        else:
            # Try other marketplaces if present in the future
            source_guess = row.get_text(" ", strip=True)
            comp.source = "eBay" if "eBay" in source_guess or "ebay" in source_guess else None

        # Image
        img = row.select_one("td#imgCol img")
        if img:
            comp.image_thumb = img.get("src")

        # Some rows include onclick="getImage('large_url','itemid')"
        # Try to extract the larger URL from onclick attributes in the <img> or surrounding jsx.
        onclick_attr = None
        if img and img.has_attr("onclick"):
            onclick_attr = img["onclick"]
        else:
            # look for any onclick in that first cell
            img_col = row.select_one("td#imgCol [onclick]")
            if img_col:
                onclick_attr = img_col.get("onclick")

        if onclick_attr:
            m = re.search(r'getImage\(\s*"(.*?)"\s*,', onclick_attr)
            if m:
                comp.image_large = m.group(1)

        # Hidden "props-data" contains rich fields like Best Offer Price, etc.
        props = row.select_one("span.props-data, .props-data")
        if props:
            props_text = props.get_text(" ", strip=True)

            # Examples to parse:
            # "Sale Price: 95 - Best Offer Price: 95 - Current Price: 131.62 - Bids: 0 - Sale Type: bestoffer - CurrentPriceFull: 131.62 USD - SalePriceFull: 95.00 USD"
            m = re.search(r"Best Offer Price:\s*([0-9.,]+)", props_text, re.I)
            if m:
                comp.best_offer_price = _clean_money(m.group(1))

            m = re.search(r"List Price:\s*([0-9.,]+)", props_text, re.I)
            if m:
                comp.list_price = _clean_money(m.group(1))

            m = re.search(r"Current Price:\s*([0-9.,]+)", props_text, re.I)
            if m:
                comp.current_price = _clean_money(m.group(1))

            m = re.search(r"\bBids:\s*(\d+)", props_text, re.I)
            if m:
                comp.bids = _clean_int(m.group(1))

            # Try to improve currency from "*Full" fields
            m = re.search(r"SalePriceFull:\s*([0-9.,]+)\s*([A-Z]{3})", props_text, re.I)
            if m and not comp.currency:
                comp.currency = m.group(2).upper()

        out.append(comp)

    return out


def to_csv(rows: List[CompRow], path: str) -> None:
    if not rows:
        # create an empty file with headers
        fieldnames = list(asdict(CompRow()).keys())
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
        return

    fieldnames = list(asdict(rows[0]).keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(asdict(r))


def to_json(rows: List[CompRow], path: str, indent: int = 2) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump([asdict(r) for r in rows], f, ensure_ascii=False, indent=indent)


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Scrape 130Point backend comps (back.130point.com/sales/)")
    p.add_argument("--query", required=True, help="Search query, e.g., 'rolex watch'")
    p.add_argument("--type", type=int, default=2, help="Type parameter (default: 2)")
    p.add_argument("--subcat", type=int, default=-1, help="Subcategory parameter (default: -1)")
    p.add_argument("--tab-id", type=int, default=7, help="tab_id parameter (default: 7)")
    p.add_argument("--tz", default="America/New_York", help="Timezone (default: America/New_York)")
    p.add_argument("--sort", default="urlEndTimeSoonest", help="Sort parameter (default: urlEndTimeSoonest)")
    p.add_argument("--extra", nargs="*", help="Extra key=value form params to include")
    p.add_argument("--csv", help="Path to write CSV (optional)")
    p.add_argument("--json", help="Path to write JSON (optional)")
    p.add_argument("--stdout-json", action="store_true", help="Print JSON to stdout (ignores --json)")
    p.add_argument("--timeout", type=float, default=30.0, help="HTTP timeout seconds")
    p.add_argument("--retries", type=int, default=3, help="HTTP retries")
    p.add_argument("--backoff", type=float, default=1.5, help="Exponential backoff base")

    args = p.parse_args(argv)

    extra_params: Dict[str, Any] = {}
    if args.extra:
        for kv in args.extra:
            if "=" not in kv:
                p.error(f"--extra expects key=value, got: {kv}")
            k, v = kv.split("=", 1)
            extra_params[k] = v

    html = fetch_html(
        query=args.query,
        type_=args.type,
        subcat=args.subcat,
        tab_id=args.tab_id,
        tz=args.tz,
        sort=args.sort,
        extra_params=extra_params,
        timeout=args.timeout,
        retries=args.retries,
        backoff=args.backoff,
    )
    rows = parse_comps(html)

    # Outputs
    if args.csv:
        to_csv(rows, args.csv)
        print(f"Wrote CSV: {args.csv}", file=sys.stderr)

    if args.stdout_json:
        print(json.dumps([asdict(r) for r in rows], ensure_ascii=False, indent=2))
    elif args.json:
        to_json(rows, args.json)
        print(f"Wrote JSON: {args.json}", file=sys.stderr)
    else:
        # Default: brief printout
        for i, r in enumerate(rows, 1):
            title = r.title or "(no title)"
            price = f"{r.sale_price} {r.currency or ''}".strip()
            date = r.date_text or ""
            link = r.link or ""
            print(f"{i:3d}. {title}\n     {price} | {r.sale_type or ''} | {date}\n     {link}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
