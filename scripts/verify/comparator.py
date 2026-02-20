from typing import Optional

from models import (
    Confidence,
    CrawlResult,
    FieldComparison,
    FieldStatus,
    ListingVerification,
    PostcodeLookup,
    VALID_REGIONS,
    VALID_STATUSES,
)
from postcode import normalize_postcode
from crawler import classify_source, get_domain, detect_rebranding

# Placeholder values that should be treated as empty (not real data)
PLACEHOLDER_VALUES = {
    "to be confirmed", "tbc", "tbd", "unknown", "n/a", "none", "pending",
}


def _is_placeholder(val: str | None) -> bool:
    """Return True if the value is a known placeholder rather than real data."""
    if val is None:
        return True
    return str(val).strip().lower() in PLACEHOLDER_VALUES


def compare_listing(
    listing: dict,
    crawl_results: list[CrawlResult],
    llm_analysis: Optional[dict],
    postcode_data: Optional[PostcodeLookup],
) -> ListingVerification:
    """
    Compare stored database values against crawled/analyzed data.
    Produces a ListingVerification with per-field comparisons.
    """
    operator = listing.get("operator") or {}
    asset_owner = listing.get("asset_owner") or {}

    verification = ListingVerification(
        development_id=listing["id"],
        development_name=listing["name"],
        development_slug=listing.get("slug", ""),
        area=listing.get("area", ""),
        operator_name=operator.get("name", "") if isinstance(operator, dict) else "",
        asset_owner_name=asset_owner.get("name", "") if isinstance(asset_owner, dict) else "",
        website_url=listing.get("website_url"),
        sources_checked=len(crawl_results),
    )

    # Check dead links
    for result in crawl_results:
        if result.is_dead_link:
            verification.dead_links.append(result.url)

    # Check for rebranding
    listing_website = listing.get("website_url", "")
    for result in crawl_results:
        if result.success and result.content:
            # Only run name-not-found check on the development's dedicated page
            is_dedicated = bool(listing_website and result.url == listing_website)
            rebranded, notes = detect_rebranding(
                result.title, result.content, listing["name"],
                is_dedicated_page=is_dedicated,
            )
            if rebranded:
                verification.rebranding_detected = True
                verification.rebranding_notes = notes
                break

    # Determine operator domain for source classification
    op_website = operator.get("website", "") if isinstance(operator, dict) else ""
    operator_domain = get_domain(op_website) if op_website else None

    # Build field comparisons
    comparison_fields = [
        ("operator", _get_stored_operator(listing), _get_found_operator(llm_analysis)),
        ("asset_owner", _get_stored_asset_owner(listing), _get_found_asset_owner(llm_analysis)),
        ("number_of_units", _str_or_none(listing.get("number_of_units")), _get_found_field(llm_analysis, "number_of_units")),
        ("status", listing.get("status"), _get_found_field(llm_analysis, "status")),
        ("development_type", listing.get("development_type"), _get_found_field(llm_analysis, "development_type")),
        ("region", listing.get("region"), _get_found_region(llm_analysis, postcode_data)),
        ("postcode", listing.get("postcode"), _get_found_postcode(llm_analysis, postcode_data)),
        ("website_url", listing.get("website_url"), _get_found_field(llm_analysis, "website_url")),
        ("description", listing.get("description"), _get_found_field(llm_analysis, "description")),
        ("latitude", _str_or_none(listing.get("latitude")), _get_found_coordinate(postcode_data, "latitude")),
        ("longitude", _str_or_none(listing.get("longitude")), _get_found_coordinate(postcode_data, "longitude")),
        ("completion_date", _str_or_none(listing.get("completion_date")), _get_found_field(llm_analysis, "completion_date")),
    ]

    for field_name, stored, found in comparison_fields:
        source = _determine_source(field_name, llm_analysis, postcode_data, crawl_results)
        comp = compare_field(field_name, stored, found, source, operator_domain, crawl_results)
        verification.field_comparisons.append(comp)

    # Calculate overall confidence
    verification.overall_confidence = _calculate_overall_confidence(verification)

    # Build notes
    verification.notes = _build_notes(verification)

    return verification


def compare_field(
    field_name: str,
    stored: Optional[str],
    found: Optional[str],
    source_url: str,
    operator_domain: Optional[str],
    crawl_results: list[CrawlResult],
) -> FieldComparison:
    """Compare a single field with type-specific matching logic."""
    stored_empty = stored is None or str(stored).strip() == "" or _is_placeholder(stored)
    found_empty = found is None or str(found).strip() == ""

    if stored_empty and found_empty:
        return FieldComparison(field_name, None, None, FieldStatus.NOT_FOUND, Confidence.LOW, source_url)

    if stored_empty and not found_empty:
        confidence = _score_source_confidence(source_url, operator_domain, crawl_results)
        return FieldComparison(
            field_name, None, str(found), FieldStatus.GAP_FILLED, confidence, source_url,
            f"Field was empty — suggested value from {_source_label(source_url)}"
        )

    if not stored_empty and found_empty:
        return FieldComparison(
            field_name, str(stored), None, FieldStatus.NOT_FOUND, Confidence.LOW, source_url,
            "Could not verify — no data found online"
        )

    # Both have values — compare
    # Special case: descriptions are always rephrased by the LLM, so a mismatch
    # is never actionable.  Mark as MATCH when both sides have content.
    if field_name == "description":
        return FieldComparison(
            field_name, str(stored), str(found), FieldStatus.MATCH,
            Confidence.HIGH, source_url,
            "Description exists in both stored data and web source"
        )

    if _fields_match(field_name, str(stored), str(found)):
        # Special case: status change detection
        if field_name == "status" and _is_status_change(str(stored), str(found)):
            return FieldComparison(
                field_name, str(stored), str(found), FieldStatus.STATUS_CHANGE,
                _score_source_confidence(source_url, operator_domain, crawl_results),
                source_url,
                f"Status appears to have changed from '{stored}' to '{found}'"
            )
        return FieldComparison(
            field_name, str(stored), str(found), FieldStatus.MATCH,
            Confidence.HIGH, source_url
        )
    else:
        confidence = _score_source_confidence(source_url, operator_domain, crawl_results)
        notes = f"Stored: '{stored}' vs Found: '{found}'"
        if field_name == "number_of_units":
            notes = f"Unit count mismatch — stored: {stored}, found: {found}"
        elif field_name == "status":
            return FieldComparison(
                field_name, str(stored), str(found), FieldStatus.STATUS_CHANGE,
                confidence, source_url,
                f"Status may need updating: '{stored}' → '{found}'"
            )
        return FieldComparison(
            field_name, str(stored), str(found), FieldStatus.DISCREPANCY,
            confidence, source_url, notes
        )


def _fields_match(field_name: str, stored: str, found: str) -> bool:
    """Field-specific matching logic."""
    if field_name == "postcode":
        return normalize_postcode(stored) == normalize_postcode(found)

    if field_name == "number_of_units":
        try:
            return abs(int(stored) - int(found)) <= 5
        except (ValueError, TypeError):
            return stored.strip() == found.strip()

    if field_name in ("latitude", "longitude"):
        try:
            return abs(float(stored) - float(found)) < 0.001
        except (ValueError, TypeError):
            return stored.strip() == found.strip()

    if field_name == "status":
        return _normalize_status(stored) == _normalize_status(found)

    if field_name == "description":
        # Descriptions are long — check if they're substantially similar
        s = stored.lower().strip()[:200]
        f = found.lower().strip()[:200]
        # Simple overlap check: if 60%+ of words overlap, consider it a match
        s_words = set(s.split())
        f_words = set(f.split())
        if not s_words or not f_words:
            return s == f
        overlap = len(s_words & f_words) / max(len(s_words), len(f_words))
        return overlap > 0.6

    # Default: case-insensitive trimmed comparison
    return stored.strip().lower() == found.strip().lower()


def _normalize_status(status: str) -> str:
    """Normalize status strings to standard values."""
    lower = status.lower().strip()
    status_map = {
        "in planning": "In Planning",
        "planned": "In Planning",
        "planning": "In Planning",
        "under construction": "Under Construction",
        "construction": "Under Construction",
        "building": "Under Construction",
        "operational": "Operational",
        "open": "Operational",
        "letting": "Operational",
        "now letting": "Operational",
        "complete": "Operational",
        "completed": "Operational",
    }
    return status_map.get(lower, status)


def _is_status_change(stored: str, found: str) -> bool:
    """Check if the status represents a progression (not just a synonym)."""
    order = {"In Planning": 0, "Under Construction": 1, "Operational": 2}
    s = _normalize_status(stored)
    f = _normalize_status(found)
    return order.get(s, -1) < order.get(f, -1)


def _score_source_confidence(
    source_url: str,
    operator_domain: Optional[str],
    crawl_results: list[CrawlResult],
) -> Confidence:
    """Score confidence based on source type and corroboration."""
    if not source_url:
        return Confidence.LOW

    if source_url == "postcodes.io":
        return Confidence.HIGH

    source_type = classify_source(source_url, operator_domain)
    successful_sources = sum(1 for r in crawl_results if r.success)

    # Operator's own website is authoritative — always HIGH
    if source_type == "operator_website":
        return Confidence.HIGH
    if successful_sources >= 2:
        return Confidence.MEDIUM
    return Confidence.LOW


def _calculate_overall_confidence(verification: ListingVerification) -> Confidence:
    """Calculate overall confidence from field-level comparisons."""
    if not verification.field_comparisons:
        return Confidence.LOW

    # Count statuses
    matches = sum(1 for c in verification.field_comparisons if c.status == FieldStatus.MATCH)
    total_checked = sum(1 for c in verification.field_comparisons if c.status != FieldStatus.NOT_FOUND)

    if total_checked == 0:
        return Confidence.LOW

    match_ratio = matches / total_checked
    has_discrepancy = any(c.status == FieldStatus.DISCREPANCY for c in verification.field_comparisons)
    has_status_change = any(c.status == FieldStatus.STATUS_CHANGE for c in verification.field_comparisons)

    if match_ratio >= 0.8 and not has_discrepancy and not has_status_change:
        return Confidence.HIGH
    if match_ratio >= 0.5 or has_status_change:
        return Confidence.MEDIUM
    return Confidence.LOW


def _build_notes(verification: ListingVerification) -> str:
    """Build human-readable notes string for the verification."""
    parts = []

    for comp in verification.field_comparisons:
        if comp.status == FieldStatus.DISCREPANCY:
            parts.append(comp.notes)
        elif comp.status == FieldStatus.STATUS_CHANGE:
            parts.append(comp.notes)
        elif comp.status == FieldStatus.GAP_FILLED:
            parts.append(comp.notes)

    if verification.dead_links:
        parts.append(f"Dead link(s): {', '.join(verification.dead_links)}")

    if verification.rebranding_detected:
        parts.append(f"Possible rebrand: {verification.rebranding_notes}")

    return " | ".join(parts) if parts else ""


# --- Helper functions for extracting stored/found values ---

def _str_or_none(val) -> Optional[str]:
    if val is None:
        return None
    return str(val)


def _get_stored_operator(listing: dict) -> Optional[str]:
    op = listing.get("operator")
    if isinstance(op, dict):
        return op.get("name")
    return None


def _get_stored_asset_owner(listing: dict) -> Optional[str]:
    ao = listing.get("asset_owner")
    if isinstance(ao, dict):
        return ao.get("name")
    return None


def _get_found_operator(llm_analysis: Optional[dict]) -> Optional[str]:
    if not llm_analysis:
        return None
    return llm_analysis.get("operator_name")


def _get_found_asset_owner(llm_analysis: Optional[dict]) -> Optional[str]:
    if not llm_analysis:
        return None
    return llm_analysis.get("asset_owner_name")


def _get_found_field(llm_analysis: Optional[dict], field: str) -> Optional[str]:
    if not llm_analysis:
        return None
    val = llm_analysis.get(field)
    if val is not None:
        return str(val)
    return None


def _get_found_region(
    llm_analysis: Optional[dict],
    postcode_data: Optional[PostcodeLookup],
) -> Optional[str]:
    # Prefer postcode-derived region (more reliable)
    if postcode_data and postcode_data.valid and postcode_data.region:
        return postcode_data.region
    if llm_analysis:
        raw = llm_analysis.get("region")
        # Only accept valid BTR regions — discard LLM hallucinations like "Hertfordshire"
        if raw and raw in VALID_REGIONS:
            return raw
    return None


def _get_found_postcode(
    llm_analysis: Optional[dict],
    postcode_data: Optional[PostcodeLookup],
) -> Optional[str]:
    # Prefer postcode data (already validated)
    if postcode_data and postcode_data.valid:
        return postcode_data.postcode
    if llm_analysis:
        return llm_analysis.get("postcode")
    return None


def _get_found_coordinate(
    postcode_data: Optional[PostcodeLookup],
    coord: str,
) -> Optional[str]:
    if not postcode_data or not postcode_data.valid:
        return None
    val = getattr(postcode_data, coord, None)
    if val is not None:
        return str(val)
    return None


def _determine_source(
    field_name: str,
    llm_analysis: Optional[dict],
    postcode_data: Optional[PostcodeLookup],
    crawl_results: list[CrawlResult],
) -> str:
    """Determine the source URL for a found value."""
    if field_name in ("latitude", "longitude"):
        if postcode_data and postcode_data.valid:
            return "postcodes.io"

    if field_name == "region":
        if postcode_data and postcode_data.valid and postcode_data.region:
            return "postcodes.io"

    if field_name == "postcode":
        if postcode_data and postcode_data.valid:
            return "postcodes.io"

    # Default: first successful crawl URL
    for result in crawl_results:
        if result.success:
            return result.url
    return ""


def _source_label(source_url: str) -> str:
    """Human-readable label for a source URL."""
    if source_url == "postcodes.io":
        return "postcodes.io API"
    if source_url:
        return get_domain(source_url) or source_url
    return "web sources"
