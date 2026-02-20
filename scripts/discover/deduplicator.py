import re
from urllib.parse import urlparse

from models import (
    Confidence,
    DiscoveredDevelopment,
    VALID_REGIONS,
    VALID_STATUSES,
)


def generate_slug(text: str) -> str:
    """Generate a URL-safe slug. Matches lib/utils.ts:generateSlug()."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def deduplicate_developments(raw_developments: list[dict]) -> list[DiscoveredDevelopment]:
    """
    Group raw LLM extractions by slug/fuzzy name, merge duplicates,
    score confidence, and return a sorted list of DiscoveredDevelopment.
    """
    groups: dict[str, list[dict]] = {}

    for dev in raw_developments:
        name = dev.get("name", "").strip()
        if not name or len(name) < 3:
            continue

        slug = generate_slug(name)
        if not slug:
            continue

        match_key = _find_match_key(groups, slug, name)
        if match_key:
            groups[match_key].append(dev)
        else:
            groups[slug] = [dev]

    results = []
    for slug, group in groups.items():
        merged = _merge_group(slug, group)
        merged.confidence_score = _score_confidence(merged)
        if merged.confidence_score >= 0.7:
            merged.confidence = Confidence.HIGH
        elif merged.confidence_score >= 0.4:
            merged.confidence = Confidence.MEDIUM
        else:
            merged.confidence = Confidence.LOW
        results.append(merged)

    results.sort(key=lambda d: d.confidence_score, reverse=True)
    return results


def _find_match_key(groups: dict[str, list[dict]], candidate_slug: str, candidate_name: str) -> str | None:
    """Fuzzy slug/name matching to group duplicate extractions."""
    if candidate_slug in groups:
        return candidate_slug

    normalized = re.sub(r"[^a-z0-9]", "", candidate_name.lower())
    for key, group in groups.items():
        existing_name = re.sub(r"[^a-z0-9]", "", group[0].get("name", "").lower())

        # Substring containment
        if len(normalized) > 5 and len(existing_name) > 5:
            if normalized in existing_name or existing_name in normalized:
                return key

        # Slug prefix match (differ by <=2 chars)
        if len(candidate_slug) > 5 and len(key) > 5:
            if candidate_slug.startswith(key) or key.startswith(candidate_slug):
                if abs(len(candidate_slug) - len(key)) <= 2:
                    return key

    return None


def _merge_group(slug: str, group: list[dict]) -> DiscoveredDevelopment:
    """Merge multiple extractions of the same development into one record."""
    # Collect all source URLs
    source_urls = []
    seen_sources = set()
    for dev in group:
        src = dev.get("_source_url", "")
        if src and src not in seen_sources:
            source_urls.append(src)
            seen_sources.add(src)

    # Pick best value for each field (first non-empty wins)
    def pick(field: str) -> str | None:
        for dev in group:
            val = dev.get(field)
            if val is not None and str(val).strip():
                return str(val).strip()
        return None

    def pick_int(field: str) -> int | None:
        for dev in group:
            val = dev.get(field)
            if val is not None:
                try:
                    return int(val)
                except (ValueError, TypeError):
                    continue
        return None

    name = pick("name") or group[0].get("name", "Unknown")
    region = pick("region")
    status = pick("status")

    # Validate constrained fields
    if region and region not in VALID_REGIONS:
        region = None
    if status and status not in VALID_STATUSES:
        status = None

    dev_type = pick("development_type") or "Multifamily"
    if dev_type not in ("Multifamily", "Single Family"):
        dev_type = "Multifamily"

    return DiscoveredDevelopment(
        name=name,
        slug=slug,
        development_type=dev_type,
        operator_name=pick("operator_name"),
        asset_owner_name=pick("asset_owner_name"),
        area=pick("area"),
        region=region,
        postcode=pick("postcode"),
        number_of_units=pick_int("number_of_units"),
        status=status,
        completion_date=pick("completion_date"),
        description=pick("description"),
        website_url=pick("website_url"),
        source_urls=source_urls,
    )


def _score_confidence(dev: DiscoveredDevelopment) -> float:
    """Score confidence 0.0-1.0 based on available data and source count."""
    score = 0.0

    # Name (always present)
    if dev.name and len(dev.name) > 2:
        score += 0.15

    # Location fields
    if dev.postcode:
        score += 0.10
    if dev.area:
        score += 0.05
    if dev.region:
        score += 0.05

    # Core details
    if dev.number_of_units:
        score += 0.10
    if dev.status:
        score += 0.07
    if dev.operator_name:
        score += 0.08

    # Source count bonus
    src_count = len(dev.source_urls)
    if src_count >= 3:
        score += 0.20
    elif src_count >= 2:
        score += 0.15
    elif src_count >= 1:
        score += 0.05

    # Source type bonus
    for url in dev.source_urls:
        src_type = _classify_source(url)
        if src_type == "news":
            score += 0.02
        elif src_type == "property_portal":
            score += 0.03

    return min(score, 1.0)


NEWS_SITES = [
    "btrnews.co.uk", "reactnews.com", "propertyweek.com",
    "egi.co.uk", "estatesgazette.com", "insidehousing.co.uk",
    "placenorth.co.uk", "urbanliving.news",
]

PROPERTY_PORTALS = [
    "rightmove.co.uk", "zoopla.co.uk", "onthemarket.com",
    "openrent.com", "spareroom.co.uk",
]

PLANNING_SITES = [
    "planningportal.co.uk", "planningresource.co.uk",
]


def _classify_source(url: str) -> str:
    """Classify a URL by source type."""
    try:
        domain = urlparse(url).netloc.lower().replace("www.", "")
    except Exception:
        return "other"

    if any(site in domain for site in NEWS_SITES):
        return "news"
    if any(site in domain for site in PROPERTY_PORTALS):
        return "property_portal"
    if any(site in domain for site in PLANNING_SITES):
        return "planning"
    return "other"
