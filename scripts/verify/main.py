"""
BTR Directory Listing Verification & Enrichment Tool

Checks existing BTR Directory listings in Supabase against live web sources,
flags discrepancies, and suggests data to fill in missing fields.

Usage:
  python scripts/verify/main.py --test               # Verify 20 listings (default)
  python scripts/verify/main.py --operator "Placefirst"
  python scripts/verify/main.py --name "Elevate, Manchester"
  python scripts/verify/main.py --all
  python scripts/verify/main.py --test --generate-sql
  python scripts/verify/main.py --test --no-llm
"""

import argparse
import asyncio
import sys
import os
from datetime import datetime

# Force UTF-8 output on Windows (cp1252 can't handle em-dashes/arrows)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add the verify directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config, load_config, validate_config
from models import ListingVerification, FieldStatus
from db import fetch_listings, get_null_fields
from crawler import crawl_listing
from analyzer import create_analyzer
from postcode import lookup_postcode
from comparator import compare_listing
from enrichment import suggest_enrichments
from output_csv import generate_csv_report
from output_summary import generate_summary
from output_sql import generate_sql_updates


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="verify",
        description="BTR Directory Listing Verification & Enrichment Tool",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--test", action="store_true", default=True, help="Test mode: verify first 20 listings (default)")
    group.add_argument("--all", action="store_true", help="Verify all published listings")
    group.add_argument("--operator", type=str, help="Verify listings for a specific operator")
    group.add_argument("--name", type=str, help="Verify a single listing by name")

    parser.add_argument("--generate-sql", action="store_true", help="Generate SQL update file")
    parser.add_argument("--no-llm", action="store_true", help="Skip LLM analysis (faster, less accurate)")

    return parser.parse_args()


def determine_mode(args: argparse.Namespace) -> tuple[str, str]:
    """Return (mode, mode_label) based on CLI args."""
    if args.name:
        return "name", f'NAME: "{args.name}"'
    if args.operator:
        return "operator", f'OPERATOR: "{args.operator}"'
    if args.all:
        return "all", "ALL"
    return "test", "TEST"


async def verify_listing(
    listing: dict,
    config: Config,
    analyzer,
    use_llm: bool,
) -> ListingVerification:
    """Run the full verification pipeline for a single listing."""
    name = listing.get("name", "Unknown")
    area = listing.get("area", "")

    # Step 1: Crawl web sources
    crawl_results = await crawl_listing(listing, config)
    successful_crawls = [r for r in crawl_results if r.success and r.content]

    # Step 2: Postcode lookup (if listing has a postcode)
    postcode_data = None
    postcode = listing.get("postcode")
    if postcode:
        postcode_data = await lookup_postcode(postcode)

    # Step 3: LLM analysis of crawled content
    llm_analysis = None
    if use_llm and analyzer and successful_crawls:
        # Combine content from all successful crawls (truncated)
        combined_content = "\n\n---\n\n".join(
            f"Source: {r.url}\n{r.content[:4000]}" for r in successful_crawls
        )
        llm_analysis = analyzer.extract_development_info(
            combined_content, name, area
        )

    # Step 4: Compare stored vs found
    verification = compare_listing(listing, crawl_results, llm_analysis, postcode_data)

    # Step 5: Suggest enrichments for empty fields
    enrichments = suggest_enrichments(listing, llm_analysis, postcode_data)

    # Merge enrichment suggestions into verification
    # Only add if the field doesn't already have a GAP_FILLED comparison
    existing_gap_fills = {
        c.field_name for c in verification.field_comparisons
        if c.status == FieldStatus.GAP_FILLED
    }
    for enrichment in enrichments:
        if enrichment.field_name not in existing_gap_fills:
            verification.field_comparisons.append(enrichment)

    return verification


async def main():
    args = parse_args()
    config = load_config()
    use_llm = not args.no_llm
    validate_config(config, use_llm=use_llm)

    mode, mode_label = determine_mode(args)
    date_str = datetime.now().strftime("%Y%m%d_%H%M%S")

    print()
    print("=" * 60)
    print("BTR Directory Listing Verification Tool")
    print("=" * 60)
    print(f"  Mode: {mode_label}")
    print(f"  LLM Analysis: {'Enabled (Claude)' if use_llm else 'Disabled (--no-llm)'}")
    print(f"  Generate SQL: {'Yes' if args.generate_sql else 'No'}")
    print()

    # Step 1: Fetch listings from Supabase
    print("Step 1: Fetching listings from Supabase...")
    listings = fetch_listings(
        config,
        mode=mode,
        operator_name=args.operator,
        listing_name=args.name,
    )

    if not listings:
        print("  No listings found matching your criteria.")
        sys.exit(0)

    print(f"  Found {len(listings)} listing(s) to verify.")

    # Track null fields across all listings
    all_null_fields: dict[str, int] = {}
    for listing in listings:
        for field in get_null_fields(listing):
            all_null_fields[field] = all_null_fields.get(field, 0) + 1

    if all_null_fields:
        print(f"  Fields with missing data: {', '.join(f'{k}({v})' for k, v in sorted(all_null_fields.items(), key=lambda x: -x[1]))}")

    print()

    # Step 2: Create analyzer
    analyzer = None
    if use_llm:
        analyzer = create_analyzer(config)
        if analyzer:
            print(f"  LLM: Claude ({config.llm_model})")
        else:
            print("  Warning: Could not create LLM analyzer. Running without LLM.")
            use_llm = False

    # Step 3: Verify each listing
    print()
    print("Step 2: Verifying listings...")
    results: list[ListingVerification] = []

    for i, listing in enumerate(listings, 1):
        name = listing.get("name", "Unknown")
        area = listing.get("area", "")
        label = f"{name} ({area})" if area else name
        print(f"  [{i}/{len(listings)}] {label}...")

        try:
            verification = await verify_listing(listing, config, analyzer, use_llm)
            results.append(verification)

            # Print quick status
            statuses = [c.status.value for c in verification.field_comparisons
                        if c.status not in (FieldStatus.MATCH, FieldStatus.NOT_FOUND)]
            if statuses:
                print(f"           Issues: {', '.join(statuses)}")
            else:
                print(f"           OK")

            if verification.dead_links:
                print(f"           Dead links: {', '.join(verification.dead_links)}")
            if verification.rebranding_detected:
                print(f"           Possible rebrand: {verification.rebranding_notes}")

        except Exception as e:
            print(f"           ERROR: {e}")
            # Create a minimal error result
            results.append(ListingVerification(
                development_id=listing.get("id", ""),
                development_name=name,
                development_slug=listing.get("slug", ""),
                area=area,
                operator_name="",
                asset_owner_name="",
                website_url=listing.get("website_url"),
                crawl_errors=[str(e)],
                notes=f"Verification failed: {e}",
            ))

    # Step 4: Generate output files
    print()
    print("Step 3: Generating reports...")

    csv_path = generate_csv_report(results, date_str, config.output_dir)
    print(f"  CSV report:  {csv_path}")

    summary_path = generate_summary(results, date_str, config.output_dir, mode=mode_label)
    print(f"  Summary:     {summary_path}")

    if args.generate_sql:
        sql_path = generate_sql_updates(results, date_str, config.output_dir)
        print(f"  SQL updates: {sql_path}")

    # Print summary to console
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    total = len(results)
    matches = sum(1 for r in results if all(
        c.status in (FieldStatus.MATCH, FieldStatus.NOT_FOUND) for c in r.field_comparisons
    ) and any(c.status == FieldStatus.MATCH for c in r.field_comparisons))
    discrepancies = sum(1 for r in results if any(
        c.status == FieldStatus.DISCREPANCY for c in r.field_comparisons
    ))
    gap_fills = sum(1 for r in results if any(
        c.status == FieldStatus.GAP_FILLED for c in r.field_comparisons
    ))
    status_changes = sum(1 for r in results if any(
        c.status == FieldStatus.STATUS_CHANGE for c in r.field_comparisons
    ))

    print(f"  Listings checked:    {total}")
    print(f"  Fully verified:      {matches}")
    print(f"  Discrepancies:       {discrepancies}")
    print(f"  Status changes:      {status_changes}")
    print(f"  Gaps filled:         {gap_fills}")
    print(f"  Dead links:          {sum(len(r.dead_links) for r in results)}")
    print(f"  Possible rebrandings: {sum(1 for r in results if r.rebranding_detected)}")
    print()

    if not args.generate_sql and (discrepancies > 0 or gap_fills > 0 or status_changes > 0):
        print("  To generate SQL update statements, re-run with --generate-sql")
        print()

    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
