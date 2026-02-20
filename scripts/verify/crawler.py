import asyncio
import logging
import re
from typing import Optional
from urllib.parse import urlparse

from crawl4ai import AsyncWebCrawler

from config import Config
from models import CrawlResult

# Suppress Crawl4AI's noisy [INIT]/[FETCH]/[COMPLETE] logging
logging.getLogger("crawl4ai").setLevel(logging.WARNING)


# Source priority classification (mirrors scripts/lib/confidence.ts)
PROPERTY_PORTALS = [
    "rightmove.co.uk", "zoopla.co.uk", "onthemarket.com",
    "openrent.com", "spareroom.co.uk",
]

NEWS_SITES = [
    "btrnews.co.uk", "urbanliving.news", "reactnews.com",
    "egi.co.uk", "estatesgazette.com", "propertyweek.com",
    "placenorth.co.uk", "insidehousing.co.uk", "costar.com",
    "buildtorent.org.uk",
]


def classify_source(url: str, operator_domain: Optional[str] = None) -> str:
    """Classify a URL into source type for confidence scoring."""
    lower = url.lower()
    if operator_domain and operator_domain in lower:
        return "operator_website"
    if any(p in lower for p in PROPERTY_PORTALS):
        return "property_portal"
    if any(n in lower for n in NEWS_SITES):
        return "news"
    if any(p in lower for p in ["planningpipe.com", "planning.", "planningportal."]):
        return "planning"
    return "other"


def get_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower().replace("www.", "")
    except Exception:
        return ""


def build_crawl_urls(listing: dict) -> list[str]:
    """
    Build prioritized list of URLs to crawl for a listing.
    1. The development's own website URL
    2. The operator's website (try slug-based path for the development)
    """
    urls = []

    # Primary: development's own website
    website_url = listing.get("website_url")
    if website_url:
        if not website_url.startswith("http"):
            website_url = f"https://{website_url}"
        urls.append(website_url)

    # Secondary: operator's website
    operator = listing.get("operator")
    if operator and isinstance(operator, dict):
        op_website = operator.get("website")
        if op_website:
            if not op_website.startswith("http"):
                op_website = f"https://{op_website}"

            # Don't duplicate if same domain as website_url
            op_domain = get_domain(op_website)
            website_domain = get_domain(website_url) if website_url else ""

            if op_domain != website_domain:
                # Try operator site with development slug path
                slug = listing.get("slug", "")
                if slug:
                    urls.append(f"{op_website.rstrip('/')}/{slug}")
                else:
                    urls.append(op_website)

    return urls


def detect_dead_link(status_code: Optional[int], error: Optional[str]) -> bool:
    """Check if a crawl result indicates a dead link."""
    if status_code and status_code in (404, 410, 403, 500, 502, 503):
        return True
    if error:
        dead_indicators = [
            "dns", "nxdomain", "err_name", "timeout",
            "connection refused", "ssl", "certificate",
            "name or service not known",
        ]
        error_lower = error.lower()
        return any(ind in error_lower for ind in dead_indicators)
    return False


def _strip_punctuation(text: str) -> str:
    """Remove punctuation for name matching (e.g. "Trader's" -> "Traders")."""
    return re.sub(r"[^\w\s]", "", text)


# Generic name prefixes that shouldn't trigger rebrand detection
GENERIC_NAME_PREFIXES = {"plot", "phase", "block", "unit", "site", "parcel", "lot"}


def detect_rebranding(
    crawled_title: str,
    crawled_content: str,
    stored_name: str,
    is_dedicated_page: bool = True,
) -> tuple[bool, str]:
    """
    Check if the crawled page suggests the development has been renamed.
    Returns (is_rebranded, notes).

    Args:
        is_dedicated_page: True if the crawled URL is the development's own
            website_url (not the operator's generic homepage). Name-not-found
            checks are skipped for operator homepages to avoid false positives.
    """
    if not crawled_title or not stored_name:
        return False, ""

    stored_lower = stored_name.lower().strip()
    title_lower = crawled_title.lower().strip()

    # Check for rebranding keywords in content
    rebrand_keywords = [
        "formerly known as", "previously called", "now called",
        "rebranded to", "rebranded as", "new name",
    ]
    content_lower = crawled_content.lower()[:5000]
    for keyword in rebrand_keywords:
        if keyword in content_lower:
            return True, f"Page contains '{keyword}' — possible rebrand"

    # Only check name-not-found on the development's own dedicated page
    if not is_dedicated_page:
        return False, ""

    # Check if stored name appears nowhere in the page
    # Normalize: strip punctuation for matching (e.g. "Trader's" -> "Traders")
    name_before_comma = stored_lower.split(",")[0].strip()
    name_parts = _strip_punctuation(name_before_comma).split()

    if len(name_parts) > 0:
        main_name = name_parts[0]

        # Skip generic code-name prefixes (e.g. "Plot M0121")
        if main_name in GENERIC_NAME_PREFIXES:
            return False, ""

        norm_title = _strip_punctuation(title_lower)
        norm_content = _strip_punctuation(content_lower[:3000])

        if len(main_name) > 3 and main_name not in norm_title and main_name not in norm_content:
            return True, f"Stored name '{stored_name}' not found in page content — possible rebrand"

    return False, ""


async def crawl_listing(listing: dict, config: Config) -> list[CrawlResult]:
    """
    Crawl web sources for a single listing using Crawl4AI.
    Returns list of CrawlResult (one per URL attempted).
    """
    urls = build_crawl_urls(listing)
    if not urls:
        return []

    # Cap at max_pages_per_listing
    urls = urls[: config.max_pages_per_listing]
    results = []

    async with AsyncWebCrawler(verbose=False) as crawler:
        for url in urls:
            try:
                result = await crawler.arun(url=url)
                status_code = getattr(result, "status_code", None)
                content = result.markdown if hasattr(result, "markdown") else ""
                title = ""
                if hasattr(result, "metadata") and result.metadata:
                    title = result.metadata.get("title", "")

                is_dead = detect_dead_link(status_code, None)
                if not result.success:
                    is_dead = detect_dead_link(status_code, str(getattr(result, "error_message", "")))

                results.append(
                    CrawlResult(
                        url=url,
                        success=result.success if hasattr(result, "success") else bool(content),
                        status_code=status_code,
                        content=content,
                        title=title,
                        is_dead_link=is_dead,
                    )
                )
            except Exception as e:
                is_dead = detect_dead_link(None, str(e))
                results.append(
                    CrawlResult(
                        url=url,
                        success=False,
                        status_code=None,
                        content="",
                        title="",
                        error=str(e),
                        is_dead_link=is_dead,
                    )
                )

            # Rate limiting between requests
            await asyncio.sleep(config.crawl_delay_seconds)

    return results
