import asyncio
import logging

from crawl4ai import AsyncWebCrawler

from models import CrawlResult

# Suppress Crawl4AI's noisy logging
logging.getLogger("crawl4ai").setLevel(logging.WARNING)


async def crawl_urls(urls: list[str], delay: float = 5.0) -> list[CrawlResult]:
    """
    Crawl a list of URLs with Crawl4AI and return their markdown content.
    Uses a single browser instance for efficiency. Rate limited between requests.
    """
    results: list[CrawlResult] = []

    async with AsyncWebCrawler(verbose=False) as crawler:
        for i, url in enumerate(urls):
            if i > 0:
                await asyncio.sleep(delay)

            try:
                result = await crawler.arun(url=url)
                content = result.markdown if hasattr(result, "markdown") else ""
                title = ""
                if hasattr(result, "metadata") and result.metadata:
                    title = result.metadata.get("title", "")

                success = result.success if hasattr(result, "success") else bool(content)

                results.append(CrawlResult(
                    url=url,
                    success=success,
                    content=content,
                    title=title,
                ))
            except Exception as e:
                results.append(CrawlResult(
                    url=url,
                    success=False,
                    content="",
                    title="",
                    error=str(e),
                ))

    return results
