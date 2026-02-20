import csv
from pathlib import Path

from models import FieldStatus, ListingVerification, VERIFY_FIELDS


# CSV columns matching the spec: one row per development,
# with _stored, _found, _status triples for each field
CSV_FIELD_COLUMNS = []
for f in VERIFY_FIELDS:
    CSV_FIELD_COLUMNS.extend([f"{f}_stored", f"{f}_found", f"{f}_status"])

CSV_COLUMNS = [
    "id",
    "name",
    "area",
    *CSV_FIELD_COLUMNS,
    "overall_confidence",
    "sources_checked",
    "notes",
]


def generate_csv_report(
    results: list[ListingVerification],
    date_str: str,
    output_dir: Path,
) -> Path:
    """Generate verification_report_{date}.csv with one row per development."""
    filepath = output_dir / f"verification_report_{date_str}.csv"

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()

        for v in results:
            row: dict = {
                "id": v.development_id,
                "name": v.development_name,
                "area": v.area,
                "overall_confidence": v.overall_confidence.value,
                "sources_checked": v.sources_checked,
                "notes": v.notes,
            }

            # Build a lookup from field_name -> FieldComparison
            comp_map = {}
            for comp in v.field_comparisons:
                # If multiple comparisons for same field (from enrichment), take the one with data
                if comp.field_name not in comp_map or (
                    comp.found_value and not comp_map[comp.field_name].found_value
                ):
                    comp_map[comp.field_name] = comp

            # Fill in field columns
            for field_name in VERIFY_FIELDS:
                comp = comp_map.get(field_name)
                if comp:
                    row[f"{field_name}_stored"] = comp.stored_value or ""
                    row[f"{field_name}_found"] = comp.found_value or ""
                    row[f"{field_name}_status"] = comp.status.value
                else:
                    row[f"{field_name}_stored"] = ""
                    row[f"{field_name}_found"] = ""
                    row[f"{field_name}_status"] = FieldStatus.NOT_FOUND.value

            writer.writerow(row)

    return filepath
