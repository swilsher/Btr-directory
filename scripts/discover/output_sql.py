import re
from pathlib import Path

from models import Confidence, DiscoveredDevelopment
from deduplicator import generate_slug


def generate_sql_inserts(
    developments: list[DiscoveredDevelopment],
    date_str: str,
    output_dir: Path,
) -> Path:
    """
    Generate SQL INSERT statements for new developments.
    Only includes MEDIUM+ confidence NEW developments.
    Uses WHERE NOT EXISTS for dedup safety.
    """
    filename = f"discovery_upload_{date_str}.sql"
    filepath = output_dir / filename

    # Filter: only NEW + MEDIUM or HIGH confidence
    eligible = [
        d for d in developments
        if d.is_new and d.confidence in (Confidence.HIGH, Confidence.MEDIUM)
    ]

    lines = []
    lines.append("-- BTR Discovery Upload SQL")
    lines.append(f"-- Generated: {date_str}")
    lines.append(f"-- Developments: {len(eligible)} (MEDIUM+ confidence, NEW only)")
    lines.append("-- REVIEW CAREFULLY BEFORE EXECUTING")
    lines.append("--")
    lines.append("-- This file uses WHERE NOT EXISTS to prevent duplicate inserts.")
    lines.append("-- It is safe to run multiple times.")
    lines.append("")

    if not eligible:
        lines.append("-- No eligible developments found (need MEDIUM+ confidence + NEW status)")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        return filepath

    # Step 1: Collect unique operators and asset owners
    operators = set()
    asset_owners = set()
    for dev in eligible:
        if dev.operator_name:
            operators.add(dev.operator_name)
        if dev.asset_owner_name:
            asset_owners.add(dev.asset_owner_name)

    # Step 2: Insert operators
    if operators:
        lines.append("-- ============================================================")
        lines.append("-- Step 1: Insert operators (if they don't already exist)")
        lines.append("-- ============================================================")
        lines.append("")
        for op_name in sorted(operators):
            op_slug = generate_slug(op_name)
            lines.append(f"INSERT INTO operators (name, slug)")
            lines.append(f"SELECT {_sql_str(op_name)}, {_sql_str(op_slug)}")
            lines.append(f"WHERE NOT EXISTS (SELECT 1 FROM operators WHERE slug = {_sql_str(op_slug)});")
            lines.append("")

    # Step 3: Insert asset owners
    if asset_owners:
        lines.append("-- ============================================================")
        lines.append("-- Step 2: Insert asset owners (if they don't already exist)")
        lines.append("-- ============================================================")
        lines.append("")
        for ao_name in sorted(asset_owners):
            ao_slug = generate_slug(ao_name)
            lines.append(f"INSERT INTO asset_owners (name, slug)")
            lines.append(f"SELECT {_sql_str(ao_name)}, {_sql_str(ao_slug)}")
            lines.append(f"WHERE NOT EXISTS (SELECT 1 FROM asset_owners WHERE slug = {_sql_str(ao_slug)});")
            lines.append("")

    # Step 4: Insert developments with FK lookups
    lines.append("-- ============================================================")
    step = 3 if asset_owners else (2 if operators else 1)
    lines.append(f"-- Step {step}: Insert developments")
    lines.append("-- ============================================================")
    lines.append("")

    for dev in eligible:
        lines.append(f"-- {dev.name} ({dev.area or 'unknown area'})")
        lines.append(f"-- Confidence: {dev.confidence.value} ({dev.confidence_score:.2f})")
        lines.append(f"-- Sources: {', '.join(dev.source_urls[:3])}")

        # Build DO $$ block if we need FK lookups
        needs_fk = bool(dev.operator_name or dev.asset_owner_name)

        if needs_fk:
            lines.append("DO $$")
            lines.append("DECLARE")
            if dev.operator_name:
                lines.append("  op_id UUID;")
            if dev.asset_owner_name:
                lines.append("  ao_id UUID;")
            lines.append("BEGIN")

            if dev.operator_name:
                op_slug = generate_slug(dev.operator_name)
                lines.append(f"  SELECT id INTO op_id FROM operators WHERE slug = {_sql_str(op_slug)};")
            if dev.asset_owner_name:
                ao_slug = generate_slug(dev.asset_owner_name)
                lines.append(f"  SELECT id INTO ao_id FROM asset_owners WHERE slug = {_sql_str(ao_slug)};")

            lines.append("")
            lines.append(f"  INSERT INTO developments (")
            fields, values = _build_insert_fields(dev, use_fk_vars=True)
            lines.append(f"    {', '.join(fields)}")
            lines.append(f"  ) SELECT")
            lines.append(f"    {', '.join(values)}")
            lines.append(f"  WHERE NOT EXISTS (SELECT 1 FROM developments WHERE slug = {_sql_str(dev.slug)});")
            lines.append("END $$;")
        else:
            lines.append(f"INSERT INTO developments (")
            fields, values = _build_insert_fields(dev, use_fk_vars=False)
            lines.append(f"  {', '.join(fields)}")
            lines.append(f") SELECT")
            lines.append(f"  {', '.join(values)}")
            lines.append(f"WHERE NOT EXISTS (SELECT 1 FROM developments WHERE slug = {_sql_str(dev.slug)});")

        lines.append("")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return filepath


def _build_insert_fields(dev: DiscoveredDevelopment, use_fk_vars: bool) -> tuple[list[str], list[str]]:
    """Build the field names and values for a development INSERT."""
    fields = ["name", "slug", "development_type"]
    values = [_sql_str(dev.name), _sql_str(dev.slug), _sql_str(dev.development_type)]

    if dev.operator_name:
        fields.append("operator_id")
        values.append("op_id" if use_fk_vars else "NULL")

    if dev.asset_owner_name:
        fields.append("asset_owner_id")
        values.append("ao_id" if use_fk_vars else "NULL")

    if dev.area:
        fields.append("area")
        values.append(_sql_str(dev.area))

    if dev.region:
        fields.append("region")
        values.append(_sql_str(dev.region))

    if dev.postcode:
        fields.append("postcode")
        values.append(_sql_str(dev.postcode))

    if dev.latitude is not None:
        fields.append("latitude")
        values.append(str(dev.latitude))

    if dev.longitude is not None:
        fields.append("longitude")
        values.append(str(dev.longitude))

    if dev.number_of_units:
        fields.append("number_of_units")
        values.append(str(dev.number_of_units))

    if dev.status:
        fields.append("status")
        values.append(_sql_str(dev.status))

    if dev.completion_date:
        fields.append("completion_date")
        values.append(_sql_str(dev.completion_date))

    if dev.description:
        fields.append("description")
        values.append(_sql_str(dev.description[:500]))

    if dev.website_url:
        fields.append("website_url")
        values.append(_sql_str(dev.website_url))

    return fields, values


def _sql_str(val: str) -> str:
    """SQL-safe string literal."""
    escaped = val.replace("'", "''")
    return f"'{escaped}'"
