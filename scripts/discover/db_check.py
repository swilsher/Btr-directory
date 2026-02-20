import re

from supabase import create_client

from models import DiscoveredDevelopment


def fetch_existing_developments(supabase_url: str, supabase_key: str) -> dict[str, str]:
    """
    Fetch all development slugs and names from Supabase.
    Returns dict mapping lowercase name -> slug.
    """
    client = create_client(supabase_url, supabase_key)
    result = client.table("developments").select("name, slug").execute()

    name_to_slug = {}
    for row in result.data or []:
        name = (row.get("name") or "").strip()
        slug = (row.get("slug") or "").strip()
        if name and slug:
            name_to_slug[name.lower()] = slug

    return name_to_slug


def check_against_database(
    developments: list[DiscoveredDevelopment],
    existing: dict[str, str],
) -> None:
    """
    Mark each development as NEW or EXISTING by checking against the database.
    Modifies developments in-place.
    """
    existing_slugs = set(existing.values())

    for dev in developments:
        # Layer 1: Exact slug match
        if dev.slug in existing_slugs:
            dev.is_new = False
            dev.notes.append(f"Slug '{dev.slug}' already in database")
            continue

        # Layer 2: Fuzzy name match (substring containment)
        dev_name_lower = dev.name.lower().strip()
        dev_name_normalized = re.sub(r"[^a-z0-9\s]", "", dev_name_lower)

        matched = False
        for db_name, db_slug in existing.items():
            db_name_normalized = re.sub(r"[^a-z0-9\s]", "", db_name)

            # Skip very short names to avoid false matches
            if len(dev_name_normalized) < 5 or len(db_name_normalized) < 5:
                continue

            if dev_name_normalized in db_name_normalized or db_name_normalized in dev_name_normalized:
                dev.is_new = False
                dev.notes.append(f"Fuzzy match with existing: '{db_name}' ({db_slug})")
                matched = True
                break

        if not matched:
            dev.is_new = True
