from pathlib import Path

from models import Confidence, FieldStatus, ListingVerification


def sql_string(val: str) -> str:
    """Escape a string for safe SQL insertion."""
    if val is None:
        return "NULL"
    escaped = val.replace("'", "''")
    return f"'{escaped}'"


def format_sql_value(field_name: str, value: str) -> str:
    """Format a value for SQL based on the field type."""
    if value is None or value == "":
        return "NULL"

    # Integer fields
    if field_name in ("number_of_units", "year_completed"):
        try:
            return str(int(value))
        except (ValueError, TypeError):
            return "NULL"

    # Decimal fields
    if field_name in ("latitude", "longitude"):
        try:
            return str(float(value))
        except (ValueError, TypeError):
            return "NULL"

    # String fields
    return sql_string(value)


def generate_sql_updates(
    results: list[ListingVerification],
    date_str: str,
    output_dir: Path,
) -> Path:
    """
    Generate suggested_updates_{date}.sql with UPDATE statements
    for approved changes. Only includes HIGH and MEDIUM confidence suggestions.
    """
    filepath = output_dir / f"suggested_updates_{date_str}.sql"

    lines = [
        "-- ============================================================================",
        f"-- BTR Directory Verification Updates",
        f"-- Generated: {date_str}",
        "-- REVIEW STATUS: PENDING MANUAL CHECK",
        "-- REVIEW EVERY LINE BEFORE EXECUTING",
        "-- These are SUGGESTIONS from automated verification, not validated changes",
        "-- ============================================================================",
        "",
    ]

    update_count = 0

    for v in results:
        # Collect updatable fields (DISCREPANCY, GAP_FILLED, STATUS_CHANGE with HIGH/MEDIUM confidence)
        updates = []
        for comp in v.field_comparisons:
            if comp.status not in (FieldStatus.DISCREPANCY, FieldStatus.GAP_FILLED, FieldStatus.STATUS_CHANGE):
                continue
            if comp.confidence not in (Confidence.HIGH, Confidence.MEDIUM):
                continue
            if not comp.found_value:
                continue
            # Skip operator and asset_owner (require FK lookup, more complex)
            if comp.field_name in ("operator", "asset_owner"):
                continue
            updates.append(comp)

        if not updates:
            continue

        update_count += 1
        lines.append(f"-- Development: {v.development_name} ({v.area})")
        lines.append(f"-- ID: {v.development_id}")

        for comp in updates:
            lines.append(
                f"-- [{comp.confidence.value}] {comp.field_name}: "
                f"{comp.stored_value or 'NULL'} -> {comp.found_value} "
                f"(source: {comp.source_url})"
            )

        set_clauses = []
        for comp in updates:
            set_clauses.append(
                f"{comp.field_name} = {format_sql_value(comp.field_name, comp.found_value)}"
            )
        set_clauses.append("updated_at = NOW()")

        set_str = ",\n    ".join(set_clauses)
        lines.append(f"UPDATE developments SET")
        lines.append(f"    {set_str}")
        lines.append(f"WHERE id = '{v.development_id}';")
        lines.append("")

    # Handle operator/asset_owner FK updates separately
    fk_updates = []
    for v in results:
        for comp in v.field_comparisons:
            if comp.field_name not in ("operator", "asset_owner"):
                continue
            if comp.status not in (FieldStatus.GAP_FILLED, FieldStatus.DISCREPANCY):
                continue
            if comp.confidence not in (Confidence.HIGH, Confidence.MEDIUM):
                continue
            if not comp.found_value:
                continue
            fk_updates.append((v, comp))

    if fk_updates:
        lines.append("-- ============================================================================")
        lines.append("-- FK Updates (operator/asset_owner) — require name lookup")
        lines.append("-- ============================================================================")
        lines.append("")

        for v, comp in fk_updates:
            table = "operators" if comp.field_name == "operator" else "asset_owners"
            fk_col = "operator_id" if comp.field_name == "operator" else "asset_owner_id"

            lines.append(f"-- Development: {v.development_name} ({v.area})")
            lines.append(f"-- [{comp.confidence.value}] {comp.field_name}: {comp.stored_value or 'NULL'} -> {comp.found_value}")
            lines.append(
                f"UPDATE developments SET {fk_col} = ("
                f"SELECT id FROM {table} WHERE name = {sql_string(comp.found_value)} LIMIT 1"
                f"), updated_at = NOW() "
                f"WHERE id = '{v.development_id}';"
            )
            lines.append("")

    # Summary
    lines.append("-- ============================================================================")
    lines.append(f"-- Total UPDATE statements: {update_count + len(fk_updates)}")
    lines.append("-- ============================================================================")

    content = "\n".join(lines) + "\n"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return filepath
