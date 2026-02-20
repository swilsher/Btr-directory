import csv
from pathlib import Path

from models import DiscoveredDevelopment


CSV_COLUMNS = [
    "db_status", "confidence", "confidence_score",
    "name", "slug", "development_type",
    "operator", "asset_owner",
    "area", "region", "postcode",
    "number_of_units", "status", "completion_date",
    "description", "website_url",
    "source_urls", "notes",
]


def generate_csv_report(
    developments: list[DiscoveredDevelopment],
    date_str: str,
    output_dir: Path,
) -> Path:
    """Generate CSV report with one row per discovered development."""
    filename = f"discovery_{date_str}.csv"
    filepath = output_dir / filename

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()

        for dev in developments:
            writer.writerow({
                "db_status": "NEW" if dev.is_new else "EXISTING",
                "confidence": dev.confidence.value,
                "confidence_score": f"{dev.confidence_score:.2f}",
                "name": dev.name,
                "slug": dev.slug,
                "development_type": dev.development_type,
                "operator": dev.operator_name or "",
                "asset_owner": dev.asset_owner_name or "",
                "area": dev.area or "",
                "region": dev.region or "",
                "postcode": dev.postcode or "",
                "number_of_units": dev.number_of_units or "",
                "status": dev.status or "",
                "completion_date": dev.completion_date or "",
                "description": (dev.description or "")[:200],
                "website_url": dev.website_url or "",
                "source_urls": " | ".join(dev.source_urls),
                "notes": " | ".join(dev.notes),
            })

    return filepath
