#!/usr/bin/env python3
"""
Test script to see what the 130Point API returns
"""

import requests
from bs4 import BeautifulSoup

BACKEND_URL = "https://back.130point.com/sales/"

DEFAULT_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://130point.com",
    "Referer": "https://130point.com/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}

data = {
    "query": "rolex watch",
    "type": "2",
    "subcat": "-1",
    "tab_id": "7",
    "tz": "America/New_York",
    "sort": "urlEndTimeSoonest",
}

print("Making request to:", BACKEND_URL)
print("With data:", data)
print("\n" + "="*80 + "\n")

try:
    resp = requests.post(BACKEND_URL, data=data, headers=DEFAULT_HEADERS, timeout=30.0)
    print(f"Status Code: {resp.status_code}")
    print(f"Response Headers: {dict(resp.headers)}")
    print(f"\nResponse Length: {len(resp.text)} characters")
    print("\n" + "="*80 + "\n")
    print("First 2000 characters of response:")
    print(resp.text[:2000])
    print("\n" + "="*80 + "\n")
    
    # Try to parse
    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.select("tr#dRow")
    print(f"Found {len(rows)} rows with id='dRow'")
    
    # Try alternative selectors
    all_trs = soup.find_all("tr")
    print(f"Total <tr> elements: {len(all_trs)}")
    
    # Check for any table structure
    tables = soup.find_all("table")
    print(f"Total <table> elements: {len(tables)}")
    
    # Look for any common container patterns
    divs = soup.find_all("div", limit=10)
    print(f"\nFirst 10 div elements:")
    for i, div in enumerate(divs, 1):
        print(f"  {i}. class={div.get('class')}, id={div.get('id')}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
