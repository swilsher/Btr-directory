import os
import asyncio
from urllib.parse import urlparse

import httpx

from models import SearchResult


EXCLUDED_DOMAINS = {
    "youtube.com", "linkedin.com", "twitter.com", "x.com",
    "facebook.com", "instagram.com", "tiktok.com",
    "pinterest.com", "reddit.com", "companieshouse.gov.uk",
    "gov.uk", "wikipedia.org",
}


def build_discovery_queries(mode: str = "test", custom_query: str = None) -> list[str]:
    """Build broad BTR discovery search queries."""
    if custom_query:
        return [custom_query]

    base_queries = [
        "build to rent development UK 2025",
        "build to rent development UK 2026",
        "new BTR scheme UK announced",
    ]

    extended_queries = [
        "build to rent planning approval UK",
        "BTR development under construction UK",
        "build to rent apartments opening UK 2025",
        "build to rent apartments opening UK 2026",
        "new build to rent homes UK",
        "BTR scheme planning permission 2025",
        "BTR scheme planning permission 2026",
        "site:btrnews.co.uk new BTR development",
        "site:reactnews.com build to rent",
        "site:propertyweek.com build to rent development",
    ]

    if mode == "test":
        return base_queries
    return base_queries + extended_queries


async def search_serpapi(queries: list[str], delay: float = 2.0) -> list[SearchResult]:
    """Run SerpAPI searches and collect results."""
    api_key = os.getenv("SERPAPI_KEY", "")
    if not api_key:
        print("  ERROR: SERPAPI_KEY not found in environment.")
        return []

    all_results: list[SearchResult] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(timeout=30.0) as client:
        for i, query in enumerate(queries):
            if i > 0:
                await asyncio.sleep(delay)

            print(f"  [{i + 1}/{len(queries)}] Searching: {query}")

            try:
                resp = await client.get(
                    "https://serpapi.com/search.json",
                    params={
                        "engine": "google",
                        "q": query,
                        "location": "United Kingdom",
                        "google_domain": "google.co.uk",
                        "gl": "uk",
                        "hl": "en",
                        "num": 20,
                        "api_key": api_key,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                print(f"    ERROR: {e}")
                continue

            organic = data.get("organic_results", [])
            added = 0
            for item in organic:
                url = item.get("link", "")
                if not url:
                    continue

                # Skip excluded domains
                domain = _get_domain(url)
                if any(excl in domain for excl in EXCLUDED_DOMAINS):
                    continue

                # Dedup by URL
                normalized = _normalize_url(url)
                if normalized in seen_urls:
                    continue
                seen_urls.add(normalized)

                all_results.append(SearchResult(
                    title=item.get("title", ""),
                    url=url,
                    snippet=item.get("snippet", ""),
                    query=query,
                ))
                added += 1

            print(f"    Found {len(organic)} results, {added} new unique URLs")

    return all_results


def cap_urls(results: list[SearchResult], max_urls: int = 50) -> list[SearchResult]:
    """Cap the total number of URLs to crawl."""
    return results[:max_urls]


def _get_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().replace("www.", "")
    except Exception:
        return ""


def _normalize_url(url: str) -> str:
    """Normalize URL for dedup (strip trailing slash, fragment, query params)."""
    try:
        parsed = urlparse(url)
        path = parsed.path.rstrip("/")
        return f"{parsed.netloc.lower()}{path}"
    except Exception:
        return url.lower()
