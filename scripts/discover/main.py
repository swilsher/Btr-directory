"""
BTR Directory Discovery Tool

Searches the web broadly for Build to Rent developments and identifies
ones not yet in the BTR Directory database.

Usage:
  python scripts/discover/main.py --test              # 3 searches, max 30 URLs
  python scripts/discover/main.py --all               # Full sweep (~12 searches)
  python scripts/discover/main.py --query "custom"    # Single custom query
  python scripts/discover/main.py --test --generate-sql
  python scripts/discover/main.py --test --no-llm     # Skip Claude, collect URLs only
"""

import argparse
import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add discover/ and verify/ to path for imports
scripts_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(scripts_dir / "verify"))

from dotenv import load_dotenv

# Load env before any imports that need it
env_path = scripts_dir / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

from search import build_discovery_queries, search_serpapi, cap_urls
from crawler import crawl_urls
from analyzer import DiscoveryAnalyzer
from deduplicator import deduplicate_developments
from db_check import fetch_existing_developments, check_against_database
from output_csv import generate_csv_report
from output_summary import generate_summary
from output_sql import generate_sql_inserts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="discover",
        description="BTR Directory Discovery Tool -- find new developments from web search",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--test", action="store_true", default=True,
                       help="Test mode: 3 search queries, max 30 URLs (default)")
    group.add_argument("--all", action="store_true",
                       help="Full sweep: ~12 search queries")
    group.add_argument("--query", type=str,
                       help="Run a single custom search query")

    parser.add_argument("--generate-sql", action="store_true",
                        help="Generate SQL INSERT file for new developments")
    parser.add_argument("--no-llm", action="store_true",
                        help="Skip Claude analysis (just collect URLs and titles)")
    parser.add_argument("--max-urls", type=int, default=50,
                        help="Max URLs to crawl (default: 50)")

    return parser.parse_args()


def validate_env(use_llm: bool) -> bool:
    """Check required environment variables."""
    errors = []

    if not os.getenv("SERPAPI_KEY"):
        errors.append(
            "SERPAPI_KEY is required for web search.\n"
            "  Get it from: https://serpapi.com/\n"
            "  Add to scripts/.env: SERPAPI_KEY=your_key_here"
        )

    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        errors.append(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.\n"
            "  Add to scripts/.env"
        )

    if use_llm and not os.getenv("ANTHROPIC_API_KEY"):
        errors.append(
            "ANTHROPIC_API_KEY is required for LLM analysis.\n"
            "  Or run with --no-llm to skip."
        )

    if errors:
        print("\n=== Configuration Errors ===\n")
        for err in errors:
            print(f"  ERROR: {err}\n")
        return False
    return True


async def main():
    args = parse_args()
    use_llm = not args.no_llm

    if not validate_env(use_llm):
        sys.exit(1)

    # Determine mode
    if args.query:
        mode = "query"
        mode_label = f'QUERY: "{args.query}"'
        max_urls = args.max_urls
    elif args.all:
        mode = "all"
        mode_label = "ALL"
        max_urls = args.max_urls
    else:
        mode = "test"
        mode_label = "TEST"
        max_urls = min(args.max_urls, 30)

    output_dir = scripts_dir / "output"
    output_dir.mkdir(exist_ok=True)
    date_str = datetime.now().strftime("%Y%m%d_%H%M%S")

    print()
    print("=" * 60)
    print("BTR Directory Discovery Tool")
    print("=" * 60)
    print(f"  Mode: {mode_label}")
    print(f"  LLM Analysis: {'Enabled (Claude)' if use_llm else 'Disabled (--no-llm)'}")
    print(f"  Max URLs: {max_urls}")
    print(f"  Generate SQL: {'Yes' if args.generate_sql else 'No'}")
    print()

    # ---- Step 1: Search ----
    print("Step 1: Searching the web via SerpAPI...")
    queries = build_discovery_queries(
        mode=mode,
        custom_query=args.query,
    )
    search_results = await search_serpapi(queries)
    print(f"  Total unique URLs found: {len(search_results)}")

    if not search_results:
        print("  No search results found. Check your SERPAPI_KEY.")
        sys.exit(0)

    capped = cap_urls(search_results, max_urls)
    print(f"  URLs to crawl (capped): {len(capped)}")
    print()

    # ---- Step 2: Crawl ----
    print("Step 2: Crawling URLs with Crawl4AI...")
    urls_to_crawl = [r.url for r in capped]
    crawl_results = await crawl_urls(urls_to_crawl, delay=5.0)

    successful = [r for r in crawl_results if r.success and r.content]
    failed = [r for r in crawl_results if not r.success]
    print(f"  Successfully crawled: {len(successful)}")
    print(f"  Failed: {len(failed)}")
    if failed:
        for r in failed[:5]:
            print(f"    - {r.url}: {r.error or 'unknown error'}")
        if len(failed) > 5:
            print(f"    ... and {len(failed) - 5} more")
    print()

    # ---- Step 3: Extract developments ----
    all_raw_developments = []

    if use_llm and successful:
        print("Step 3: Extracting developments with Claude...")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        analyzer = DiscoveryAnalyzer(api_key=anthropic_key)

        for i, crawl in enumerate(successful, 1):
            print(f"  [{i}/{len(successful)}] Analyzing: {crawl.url[:80]}...")
            developments = analyzer.extract_developments(crawl.content, crawl.url)
            if developments:
                print(f"    Found {len(developments)} development(s)")
                all_raw_developments.extend(developments)
            else:
                print(f"    No developments found")

        print(f"  Total raw mentions: {len(all_raw_developments)}")
        print()
    elif not use_llm:
        print("Step 3: Skipped (--no-llm)")
        print()
    else:
        print("Step 3: Skipped (no successful crawls)")
        print()

    # ---- Step 4: Deduplicate ----
    print("Step 4: Deduplicating discoveries...")
    deduplicated = deduplicate_developments(all_raw_developments)
    print(f"  Unique developments after dedup: {len(deduplicated)}")
    print()

    # ---- Step 5: Enrich with postcodes.io ----
    # Import postcode lookup from verify tool
    try:
        from postcode import lookup_postcode

        postcode_devs = [d for d in deduplicated if d.postcode and not d.latitude]
        if postcode_devs:
            print("Step 5: Enriching postcodes via postcodes.io...")
            for dev in postcode_devs:
                pc_data = await lookup_postcode(dev.postcode)
                if pc_data and pc_data.valid:
                    if pc_data.latitude and not dev.latitude:
                        dev.latitude = pc_data.latitude
                    if pc_data.longitude and not dev.longitude:
                        dev.longitude = pc_data.longitude
                    if pc_data.region and not dev.region:
                        dev.region = pc_data.region
            print(f"  Enriched {len(postcode_devs)} development(s)")
            print()
        else:
            print("Step 5: No postcodes to enrich")
            print()
    except ImportError:
        print("Step 5: Skipped (postcode module not available)")
        print()

    # ---- Step 6: Check against database ----
    print("Step 6: Checking against Supabase database...")
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    existing = fetch_existing_developments(supabase_url, supabase_key)
    print(f"  Existing developments in database: {len(existing)}")

    check_against_database(deduplicated, existing)
    new_count = sum(1 for d in deduplicated if d.is_new)
    existing_count = sum(1 for d in deduplicated if not d.is_new)
    print(f"  NEW (not in database): {new_count}")
    print(f"  EXISTING (already in): {existing_count}")
    print()

    # ---- Step 7: Generate outputs ----
    print("Step 7: Generating reports...")

    csv_path = generate_csv_report(deduplicated, date_str, output_dir)
    print(f"  CSV report:  {csv_path}")

    summary_path = generate_summary(
        deduplicated, date_str, output_dir,
        mode=mode_label,
        queries_used=len(queries),
        urls_found=len(search_results),
        urls_crawled=len(successful),
        urls_failed=len(failed),
        raw_mentions=len(all_raw_developments),
    )
    print(f"  Summary:     {summary_path}")

    if args.generate_sql:
        sql_path = generate_sql_inserts(deduplicated, date_str, output_dir)
        print(f"  SQL inserts: {sql_path}")

    # ---- Summary ----
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Search queries:      {len(queries)}")
    print(f"  URLs crawled:        {len(successful)}/{len(urls_to_crawl)}")
    print(f"  Raw mentions:        {len(all_raw_developments)}")
    print(f"  Unique developments: {len(deduplicated)}")
    print(f"  NEW:                 {new_count}")
    print(f"  EXISTING:            {existing_count}")

    from models import Confidence
    high = sum(1 for d in deduplicated if d.is_new and d.confidence == Confidence.HIGH)
    medium = sum(1 for d in deduplicated if d.is_new and d.confidence == Confidence.MEDIUM)
    low = sum(1 for d in deduplicated if d.is_new and d.confidence == Confidence.LOW)
    print(f"  New HIGH confidence: {high}")
    print(f"  New MEDIUM:          {medium}")
    print(f"  New LOW:             {low}")
    print()

    if not args.generate_sql and new_count > 0:
        print("  To generate SQL inserts, re-run with --generate-sql")
        print()

    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
