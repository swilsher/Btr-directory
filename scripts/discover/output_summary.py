from pathlib import Path

from models import Confidence, DiscoveredDevelopment


def generate_summary(
    developments: list[DiscoveredDevelopment],
    date_str: str,
    output_dir: Path,
    mode: str = "TEST",
    queries_used: int = 0,
    urls_found: int = 0,
    urls_crawled: int = 0,
    urls_failed: int = 0,
    raw_mentions: int = 0,
) -> Path:
    """Generate a human-readable text summary of the discovery run."""
    filename = f"discovery_summary_{date_str}.txt"
    filepath = output_dir / filename

    new_devs = [d for d in developments if d.is_new]
    existing_devs = [d for d in developments if not d.is_new]

    high_new = [d for d in new_devs if d.confidence == Confidence.HIGH]
    medium_new = [d for d in new_devs if d.confidence == Confidence.MEDIUM]
    low_new = [d for d in new_devs if d.confidence == Confidence.LOW]

    lines = []
    lines.append("=" * 60)
    lines.append("BTR Discovery Report")
    lines.append(f"Date: {date_str}")
    lines.append(f"Mode: {mode}")
    lines.append("=" * 60)
    lines.append("")

    lines.append("SEARCH:")
    lines.append(f"  Queries executed:       {queries_used}")
    lines.append(f"  Total URLs found:       {urls_found}")
    lines.append(f"  Successfully crawled:   {urls_crawled}")
    lines.append(f"  Failed:                 {urls_failed}")
    lines.append("")

    lines.append("EXTRACTION:")
    lines.append(f"  Total mentions found:   {raw_mentions}")
    lines.append(f"  After deduplication:    {len(developments)}")
    lines.append("")

    lines.append("DATABASE CHECK:")
    lines.append(f"  NEW (not in database):  {len(new_devs)}")
    lines.append(f"  EXISTING (already in):  {len(existing_devs)}")
    lines.append("")

    lines.append("CONFIDENCE (new developments only):")
    lines.append(f"  HIGH:   {len(high_new)}")
    lines.append(f"  MEDIUM: {len(medium_new)}")
    lines.append(f"  LOW:    {len(low_new)}")
    lines.append("")

    if new_devs:
        lines.append("-" * 60)
        lines.append("TOP NEW DISCOVERIES:")
        lines.append("-" * 60)
        for i, dev in enumerate(new_devs[:30], 1):
            parts = [f"[{dev.confidence.value}]", dev.name]
            if dev.area:
                parts.append(f"- {dev.area}")
            if dev.operator_name:
                parts.append(f"- {dev.operator_name}")
            if dev.number_of_units:
                parts.append(f"- {dev.number_of_units} units")
            if dev.status:
                parts.append(f"- {dev.status}")
            lines.append(f"  {i}. {' '.join(parts)}")
        lines.append("")

    if existing_devs:
        lines.append("-" * 60)
        lines.append("EXISTING (already in database):")
        lines.append("-" * 60)
        for dev in existing_devs[:20]:
            note = dev.notes[0] if dev.notes else ""
            lines.append(f"  - {dev.name} ({dev.area or 'unknown area'}) -- {note}")
        if len(existing_devs) > 20:
            lines.append(f"  ... and {len(existing_devs) - 20} more")
        lines.append("")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return filepath
