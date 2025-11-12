"""
130Point scraper module.

Fetches sales comps from https://back.130point.com/sales/
"""

from .scraper_130point import (
    CompRow,
    fetch_html,
    parse_comps,
    to_csv,
    to_json,
    BACKEND_URL,
    DEFAULT_HEADERS,
)

__all__ = [
    "CompRow",
    "fetch_html",
    "parse_comps",
    "to_csv",
    "to_json",
    "BACKEND_URL",
    "DEFAULT_HEADERS",
]

__version__ = "1.0.0"
