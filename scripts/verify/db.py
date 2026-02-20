from typing import Optional

from supabase import create_client, Client

from config import Config


def create_supabase_client(config: Config) -> Client:
    """Create Supabase client with service role key (bypasses RLS)."""
    return create_client(config.supabase_url, config.supabase_service_key)


def fetch_listings(
    config: Config,
    mode: str = "test",
    operator_name: Optional[str] = None,
    listing_name: Optional[str] = None,
) -> list[dict]:
    """
    Fetch development listings from Supabase with joined operator/asset_owner data.

    Modes:
      - "test": First N listings (config.test_limit, default 20)
      - "all": All published listings
      - "operator": Filter by operator name
      - "name": Filter by development name (partial match)
    """
    client = create_supabase_client(config)

    select_fields = (
        "id, name, slug, number_of_units, status, development_type, "
        "region, area, postcode, website_url, description, "
        "completion_date, year_completed, latitude, longitude, "
        "operator:operators(id, name, slug, website), "
        "asset_owner:asset_owners(id, name, slug, website)"
    )

    query = (
        client.table("developments")
        .select(select_fields)
        .eq("is_published", True)
        .order("created_at", desc=True)
    )

    if mode == "name" and listing_name:
        query = query.ilike("name", f"%{listing_name}%")
    elif mode == "operator" and operator_name:
        # Look up operator ID first, then filter
        op_result = (
            client.table("operators")
            .select("id")
            .ilike("name", f"%{operator_name}%")
            .execute()
        )
        if not op_result.data:
            print(f"  No operator found matching '{operator_name}'")
            return []
        op_ids = [op["id"] for op in op_result.data]
        query = query.in_("operator_id", op_ids)
    elif mode == "test":
        query = query.limit(config.test_limit)
    # mode == "all" has no additional filter

    result = query.execute()
    return result.data or []


def get_null_fields(listing: dict) -> list[str]:
    """Return list of field names that are NULL or empty for a listing."""
    fields_to_check = {
        "number_of_units": listing.get("number_of_units"),
        "status": listing.get("status"),
        "development_type": listing.get("development_type"),
        "region": listing.get("region"),
        "area": listing.get("area"),
        "postcode": listing.get("postcode"),
        "website_url": listing.get("website_url"),
        "description": listing.get("description"),
        "completion_date": listing.get("completion_date"),
        "latitude": listing.get("latitude"),
        "longitude": listing.get("longitude"),
        "operator": listing.get("operator"),
        "asset_owner": listing.get("asset_owner"),
    }
    return [k for k, v in fields_to_check.items() if v is None or v == ""]
