from pathlib import Path

from models import Confidence, FieldStatus, ListingVerification, VERIFY_FIELDS


def generate_summary(
    results: list[ListingVerification],
    date_str: str,
    output_dir: Path,
    mode: str = "TEST",
) -> Path:
    """Generate verification_summary_{date}.txt with human-readable overview."""
    filepath = output_dir / f"verification_summary_{date_str}.txt"

    total = len(results)
    if total == 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"BTR Directory Verification Report\nDate: {date_str}\nMode: {mode}\n\nNo listings checked.\n")
        return filepath

    # Count categories
    fully_verified = 0
    discrepancies_found = 0
    gaps_filled = 0
    could_not_verify = 0
    status_changes = 0

    for v in results:
        statuses = [c.status for c in v.field_comparisons]
        if all(s in (FieldStatus.MATCH, FieldStatus.NOT_FOUND) for s in statuses):
            if any(s == FieldStatus.MATCH for s in statuses):
                fully_verified += 1
            else:
                could_not_verify += 1
        elif any(s == FieldStatus.DISCREPANCY for s in statuses):
            discrepancies_found += 1
        elif any(s == FieldStatus.STATUS_CHANGE for s in statuses):
            status_changes += 1
        elif any(s == FieldStatus.GAP_FILLED for s in statuses):
            gaps_filled += 1
        else:
            could_not_verify += 1

    # Count dead links and rebrandings
    dead_link_count = sum(len(v.dead_links) for v in results)
    rebranding_count = sum(1 for v in results if v.rebranding_detected)

    # Count missing fields
    field_missing_counts: dict[str, int] = {f: 0 for f in VERIFY_FIELDS}
    for v in results:
        for comp in v.field_comparisons:
            if comp.stored_value is None or comp.stored_value == "":
                if comp.field_name in field_missing_counts:
                    field_missing_counts[comp.field_name] += 1

    # Count gap fills by source type
    postcode_fills = 0
    llm_fills = 0
    for v in results:
        for comp in v.field_comparisons:
            if comp.status == FieldStatus.GAP_FILLED:
                if comp.source_url == "postcodes.io":
                    postcode_fills += 1
                else:
                    llm_fills += 1

    # Top issues
    top_issues = []
    for v in results:
        for comp in v.field_comparisons:
            if comp.status in (FieldStatus.DISCREPANCY, FieldStatus.STATUS_CHANGE):
                top_issues.append(
                    f'"{v.development_name}" — {comp.field_name}: {comp.notes}'
                )
        if v.dead_links:
            top_issues.append(
                f'"{v.development_name}" — dead link(s): {", ".join(v.dead_links)}'
            )
        if v.rebranding_detected:
            top_issues.append(
                f'"{v.development_name}" — {v.rebranding_notes}'
            )

    # Build output
    lines = [
        "=" * 60,
        f"BTR Directory Verification Report",
        f"Date: {date_str}",
        f"Listings checked: {total}",
        f"Mode: {mode}",
        "=" * 60,
        "",
        "RESULTS:",
        f"  Fully verified (all fields match):   {fully_verified}",
        f"  Discrepancies found:                 {discrepancies_found}",
        f"  Status changes detected:             {status_changes}",
        f"  Gaps filled with suggestions:        {gaps_filled}",
        f"  Could not verify (insufficient data): {could_not_verify}",
        "",
        f"Dead links found: {dead_link_count}",
        f"Possible rebrandings: {rebranding_count}",
        "",
    ]

    if top_issues:
        lines.append("TOP ISSUES:")
        for i, issue in enumerate(top_issues[:15], 1):
            lines.append(f"  {i}. {issue}")
        lines.append("")

    # Fields most commonly missing
    missing_sorted = sorted(
        field_missing_counts.items(),
        key=lambda x: x[1],
        reverse=True,
    )
    missing_any = [(f, c) for f, c in missing_sorted if c > 0]
    if missing_any:
        lines.append("FIELDS MOST COMMONLY MISSING:")
        for field_name, count in missing_any:
            pct = round(count / total * 100)
            lines.append(f"  - {field_name}: {count} listings ({pct}%)")
        lines.append("")

    # Gap fill suggestions summary
    if postcode_fills > 0 or llm_fills > 0:
        lines.append("GAP FILL SUGGESTIONS:")
        if postcode_fills > 0:
            lines.append(f"  - {postcode_fills} field(s) filled via postcodes.io (coordinates, region)")
        if llm_fills > 0:
            lines.append(f"  - {llm_fills} field(s) suggested from web content analysis")
        lines.append("")

    # Confidence breakdown
    high = sum(1 for v in results if v.overall_confidence == Confidence.HIGH)
    medium = sum(1 for v in results if v.overall_confidence == Confidence.MEDIUM)
    low = sum(1 for v in results if v.overall_confidence == Confidence.LOW)
    lines.append("CONFIDENCE BREAKDOWN:")
    lines.append(f"  HIGH:   {high}")
    lines.append(f"  MEDIUM: {medium}")
    lines.append(f"  LOW:    {low}")
    lines.append("")

    # Per-listing details
    lines.append("-" * 60)
    lines.append("LISTING DETAILS:")
    lines.append("-" * 60)
    for v in results:
        lines.append(f"\n  {v.development_name} ({v.area})")
        lines.append(f"  Operator: {v.operator_name or 'N/A'}")
        lines.append(f"  Confidence: {v.overall_confidence.value}")
        lines.append(f"  Sources checked: {v.sources_checked}")
        if v.notes:
            lines.append(f"  Notes: {v.notes}")
        for comp in v.field_comparisons:
            if comp.status not in (FieldStatus.MATCH, FieldStatus.NOT_FOUND):
                lines.append(
                    f"    [{comp.status.value}] {comp.field_name}: "
                    f"stored='{comp.stored_value or 'NULL'}' "
                    f"found='{comp.found_value or 'NULL'}' "
                    f"(confidence: {comp.confidence.value})"
                )

    content = "\n".join(lines) + "\n"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return filepath
