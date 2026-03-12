"""
Alkansya.ph Rate Scraper
====================
Scrapes interest rates from Philippine bank websites and updates Supabase.
Designed to run as a Railway cron job (weekly).

Usage:
  python scraper.py           # Run all scrapers
  python scraper.py --bank bpi  # Run single bank
  python scraper.py --dry-run   # Print results, don't write to DB
"""

import os
import re
import sys
import json
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("alkansya-scraper")

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class ScrapedRate:
    bank_id: str
    product_type: str  # 'savings' or 'time_deposit'
    term_days: Optional[int]  # None for savings
    rate: float  # e.g. 3.5 for 3.5%
    min_deposit: float = 0
    max_deposit: Optional[float] = None


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def fetch_page(url: str, timeout: int = 30, verify_ssl: bool = True) -> Optional[BeautifulSoup]:
    """Fetch a page and return parsed BeautifulSoup, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=verify_ssl)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        log.error(f"Failed to fetch {url}: {e}")
        return None


def extract_rate(text: str) -> Optional[float]:
    """Extract a percentage rate from text like '0.0625%' or '3.5% p.a.'"""
    match = re.search(r"(\d+\.?\d*)\s*%", text)
    if match:
        return float(match.group(1))
    return None


# ---------------------------------------------------------------------------
# Per-bank scrapers
# ---------------------------------------------------------------------------

def scrape_bpi() -> list[ScrapedRate]:
    """BPI deposit rates page."""
    url = "https://www.bpi.com.ph/personal/bank/deposits/deposit-rates-savings-and-checking"
    soup = fetch_page(url)
    if not soup:
        return []

    rates = []
    tables = soup.find_all("table")
    for table in tables:
        text = table.get_text(" ", strip=True).lower()
        if "savings" in text or "passbook" in text:
            cells = table.find_all("td")
            for cell in cells:
                r = extract_rate(cell.get_text())
                if r is not None and r < 1:
                    rates.append(ScrapedRate("bpi", "savings", None, r))
                    break

    if not rates:
        body = soup.get_text(" ", strip=True)
        matches = re.findall(r"(?:savings|passbook)[^%]*?(\d+\.?\d*)\s*%", body, re.IGNORECASE)
        for m in matches:
            val = float(m)
            if val < 2:
                rates.append(ScrapedRate("bpi", "savings", None, val))
                break

    log.info(f"BPI: scraped {len(rates)} rates")
    return rates


def scrape_bdo() -> list[ScrapedRate]:
    """BDO rates."""
    url = "https://www.bdo.com.ph/personal/accounts/peso-savings/passbook-savings"
    soup = fetch_page(url)
    if not soup:
        return []

    rates = []
    body = soup.get_text(" ", strip=True)
    matches = re.findall(r"(\d+\.?\d*)\s*%\s*(?:per annum|p\.?a\.?|annual)", body, re.IGNORECASE)
    for m in matches:
        val = float(m)
        if val < 2:
            rates.append(ScrapedRate("bdo", "savings", None, val))
            break

    log.info(f"BDO: scraped {len(rates)} rates")
    return rates


def scrape_metrobank() -> list[ScrapedRate]:
    """Metrobank rates page."""
    url = "https://www.metrobank.com.ph/articles/time-deposit-rates-and-fees"
    soup = fetch_page(url)
    if not soup:
        return []

    rates = []
    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all(["td", "th"])
            text = " ".join(c.get_text(strip=True) for c in cells).lower()

            term_map = {
                "30": 30, "60": 60, "90": 90, "120": 120,
                "180": 180, "360": 360, "365": 360,
            }
            for term_str, term_days in term_map.items():
                if term_str in text:
                    for cell in cells:
                        r = extract_rate(cell.get_text())
                        if r is not None:
                            rates.append(ScrapedRate("metrobank", "time_deposit", term_days, r))
                            break

    log.info(f"Metrobank: scraped {len(rates)} rates")
    return rates


def scrape_maya() -> list[ScrapedRate]:
    """Maya Bank."""
    # Try multiple possible URLs
    urls = [
        "https://www.maya.ph/savings",
        "https://www.maya.ph/",
        "https://maya.ph/",
    ]
    soup = None
    for url in urls:
        soup = fetch_page(url)
        if soup:
            break
    if not soup:
        return []

    rates = []
    body = soup.get_text(" ", strip=True)
    matches = re.findall(r"(\d+\.?\d*)\s*%\s*(?:per annum|p\.?a\.?|interest|annual)", body, re.IGNORECASE)
    for m in matches:
        val = float(m)
        if 1 < val < 10:
            rates.append(ScrapedRate("maya", "savings", None, val))
            break

    log.info(f"Maya: scraped {len(rates)} rates")
    return rates


def scrape_cimb() -> list[ScrapedRate]:
    """CIMB UpSave."""
    # Try with SSL verification disabled as fallback
    url = "https://www.cimb.com.ph/en/personal/banking/accounts/upsave.html"
    soup = fetch_page(url)
    if not soup:
        soup = fetch_page(url, verify_ssl=False)
    if not soup:
        return []

    rates = []
    body = soup.get_text(" ", strip=True)
    matches = re.findall(r"(\d+\.?\d*)\s*%\s*(?:per annum|p\.?a\.?|interest)", body, re.IGNORECASE)
    for m in matches:
        val = float(m)
        if 1 < val < 10:
            rates.append(ScrapedRate("cimb", "savings", None, val))
            break

    log.info(f"CIMB: scraped {len(rates)} rates")
    return rates


def scrape_tonik() -> list[ScrapedRate]:
    """Tonik digital bank."""
    url = "https://www.tonik.com/"
    soup = fetch_page(url)
    if not soup:
        return []

    rates = []
    body = soup.get_text(" ", strip=True)
    matches = re.findall(r"(\d+\.?\d*)\s*%\s*(?:per annum|p\.?a\.?|interest|annual)", body, re.IGNORECASE)
    for m in matches:
        val = float(m)
        if 1 < val < 10:
            rates.append(ScrapedRate("tonik", "savings", None, val))
            break

    log.info(f"Tonik: scraped {len(rates)} rates")
    return rates


def scrape_seabank() -> list[ScrapedRate]:
    """SeaBank."""
    url = "https://www.seabank.ph/"
    soup = fetch_page(url)
    if not soup:
        return []

    rates = []
    body = soup.get_text(" ", strip=True)
    matches = re.findall(r"(\d+\.?\d*)\s*%\s*(?:per annum|p\.?a\.?|interest|annual)", body, re.IGNORECASE)
    for m in matches:
        val = float(m)
        if 1 < val < 10:
            rates.append(ScrapedRate("seabank", "savings", None, val))
            break

    log.info(f"SeaBank: scraped {len(rates)} rates")
    return rates


# Registry of all scrapers
SCRAPERS = {
    "bpi": scrape_bpi,
    "bdo": scrape_bdo,
    "metrobank": scrape_metrobank,
    "maya": scrape_maya,
    "cimb": scrape_cimb,
    "tonik": scrape_tonik,
    "seabank": scrape_seabank,
}


# ---------------------------------------------------------------------------
# Supabase writer (REST API)
# ---------------------------------------------------------------------------

def write_to_supabase(scraped: list[ScrapedRate]):
    """Write scraped rates to Supabase via REST API."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        return

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    for rate in scraped:
        try:
            # Mark existing current rates as not current
            params = {
                "bank_id": f"eq.{rate.bank_id}",
                "product_type": f"eq.{rate.product_type}",
                "is_current": "eq.true",
            }
            if rate.term_days is not None:
                params["term_days"] = f"eq.{rate.term_days}"
            else:
                params["term_days"] = "is.null"

            requests.patch(
                f"{url}/rest/v1/rates",
                headers=headers,
                params=params,
                json={"is_current": False},
            )

            # Insert new rate
            resp = requests.post(
                f"{url}/rest/v1/rates",
                headers=headers,
                json={
                    "bank_id": rate.bank_id,
                    "product_type": rate.product_type,
                    "term_days": rate.term_days,
                    "rate": rate.rate,
                    "min_deposit": rate.min_deposit,
                    "max_deposit": rate.max_deposit,
                    "source": "scraper",
                    "is_current": True,
                },
            )
            resp.raise_for_status()

            log.info(f"Updated {rate.bank_id} {rate.product_type} "
                     f"{'(' + str(rate.term_days) + 'd)' if rate.term_days else ''}: {rate.rate}%")

        except Exception as e:
            log.error(f"DB write failed for {rate.bank_id}: {e}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(bank_filter: Optional[str] = None, dry_run: bool = False):
    """Run scrapers and optionally write to database."""
    log.info("=" * 50)
    log.info(f"Alkansya.ph scraper starting at {datetime.now(timezone.utc).isoformat()}")
    log.info(f"Banks: {bank_filter or 'all'} | Dry run: {dry_run}")
    log.info("=" * 50)

    all_rates: list[ScrapedRate] = []

    scrapers_to_run = SCRAPERS
    if bank_filter:
        if bank_filter in SCRAPERS:
            scrapers_to_run = {bank_filter: SCRAPERS[bank_filter]}
        else:
            log.error(f"Unknown bank: {bank_filter}. Available: {list(SCRAPERS.keys())}")
            return

    for bank_id, scraper_fn in scrapers_to_run.items():
        try:
            log.info(f"Scraping {bank_id}...")
            rates = scraper_fn()
            all_rates.extend(rates)
        except Exception as e:
            log.error(f"Scraper crashed for {bank_id}: {e}")

    log.info(f"\nTotal rates scraped: {len(all_rates)}")

    if dry_run:
        log.info("DRY RUN — printing results:")
        for r in all_rates:
            print(json.dumps(asdict(r), indent=2))
    else:
        if all_rates:
            write_to_supabase(all_rates)
            log.info("Database updated successfully.")
        else:
            log.warning("No rates scraped. Database unchanged.")

    log.info("Done.")


if __name__ == "__main__":
    bank = None
    dry = "--dry-run" in sys.argv

    for arg in sys.argv[1:]:
        if arg.startswith("--bank="):
            bank = arg.split("=")[1]
        elif arg == "--bank" and sys.argv.index(arg) + 1 < len(sys.argv):
            bank = sys.argv[sys.argv.index(arg) + 1]

    run(bank_filter=bank, dry_run=dry)
