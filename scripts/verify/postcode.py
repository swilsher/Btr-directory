import re
from typing import Optional

import httpx

from models import PostcodeLookup

POSTCODES_IO_BASE = "https://api.postcodes.io"

# UK postcode area prefix -> BTR region mapping
# Ported verbatim from scripts/lib/postcode-regions.ts
POSTCODE_REGION_MAP: dict[str, str] = {
    # London
    "E": "London", "EC": "London", "N": "London", "NW": "London",
    "SE": "London", "SW": "London", "W": "London", "WC": "London",
    # South East
    "BN": "South East", "CT": "South East", "GU": "South East",
    "HP": "South East", "ME": "South East", "MK": "South East",
    "OX": "South East", "PO": "South East", "RG": "South East",
    "RH": "South East", "SL": "South East", "SO": "South East",
    "TN": "South East", "KT": "South East", "SM": "South East",
    "CR": "South East", "BR": "South East", "DA": "South East",
    "EN": "South East", "HA": "South East", "IG": "South East",
    "RM": "South East", "TW": "South East", "UB": "South East",
    "WD": "South East",
    # South West
    "BA": "South West", "BH": "South West", "BS": "South West",
    "DT": "South West", "EX": "South West", "GL": "South West",
    "PL": "South West", "SN": "South West", "SP": "South West",
    "TA": "South West", "TQ": "South West", "TR": "South West",
    # East of England
    "AL": "East of England", "CB": "East of England", "CM": "East of England",
    "CO": "East of England", "IP": "East of England", "LU": "East of England",
    "NR": "East of England", "PE": "East of England", "SG": "East of England",
    "SS": "East of England",
    # East Midlands
    "DE": "East Midlands", "LE": "East Midlands", "LN": "East Midlands",
    "NG": "East Midlands", "NN": "East Midlands",
    # West Midlands
    "B": "West Midlands", "CV": "West Midlands", "DY": "West Midlands",
    "HR": "West Midlands", "ST": "West Midlands", "TF": "West Midlands",
    "WR": "West Midlands", "WS": "West Midlands", "WV": "West Midlands",
    # North West
    "BB": "North West", "BL": "North West", "CA": "North West",
    "CH": "North West", "CW": "North West", "FY": "North West",
    "L": "North West", "LA": "North West", "M": "North West",
    "OL": "North West", "PR": "North West", "SK": "North West",
    "WA": "North West", "WN": "North West",
    # North East
    "DH": "North East", "DL": "North East", "NE": "North East",
    "SR": "North East", "TS": "North East",
    # Yorkshire and The Humber
    "BD": "Yorkshire and The Humber", "DN": "Yorkshire and The Humber",
    "HD": "Yorkshire and The Humber", "HG": "Yorkshire and The Humber",
    "HU": "Yorkshire and The Humber", "HX": "Yorkshire and The Humber",
    "LS": "Yorkshire and The Humber", "S": "Yorkshire and The Humber",
    "WF": "Yorkshire and The Humber", "YO": "Yorkshire and The Humber",
    # Scotland
    "AB": "Scotland", "DD": "Scotland", "EH": "Scotland",
    "FK": "Scotland", "G": "Scotland", "IV": "Scotland",
    "KA": "Scotland", "KW": "Scotland", "KY": "Scotland",
    "ML": "Scotland", "PA": "Scotland", "PH": "Scotland",
    "TD": "Scotland", "ZE": "Scotland",
    # Wales
    "CF": "Wales", "LD": "Wales", "LL": "Wales",
    "NP": "Wales", "SA": "Wales", "SY": "Wales",
    # Northern Ireland
    "BT": "Northern Ireland",
}

# City/town name -> region fallback
# Ported verbatim from scripts/lib/postcode-regions.ts
CITY_REGION_MAP: dict[str, str] = {
    "london": "London",
    "manchester": "North West", "liverpool": "North West", "chester": "North West",
    "preston": "North West", "bolton": "North West", "wigan": "North West",
    "salford": "North West", "stockport": "North West", "warrington": "North West",
    "blackpool": "North West", "burnley": "North West", "oldham": "North West",
    "rochdale": "North West", "lancaster": "North West",
    "birmingham": "West Midlands", "coventry": "West Midlands", "wolverhampton": "West Midlands",
    "dudley": "West Midlands", "walsall": "West Midlands", "stoke-on-trent": "West Midlands",
    "leeds": "Yorkshire and The Humber", "sheffield": "Yorkshire and The Humber",
    "bradford": "Yorkshire and The Humber", "hull": "Yorkshire and The Humber",
    "york": "Yorkshire and The Humber", "huddersfield": "Yorkshire and The Humber",
    "doncaster": "Yorkshire and The Humber", "wakefield": "Yorkshire and The Humber",
    "barnsley": "Yorkshire and The Humber", "rotherham": "Yorkshire and The Humber",
    "halifax": "Yorkshire and The Humber",
    "newcastle": "North East", "sunderland": "North East", "durham": "North East",
    "middlesbrough": "North East", "darlington": "North East", "gateshead": "North East",
    "hartlepool": "North East",
    "bristol": "South West", "exeter": "South West", "plymouth": "South West",
    "bath": "South West", "gloucester": "South West", "cheltenham": "South West",
    "swindon": "South West", "bournemouth": "South West", "poole": "South West",
    "taunton": "South West",
    "brighton": "South East", "oxford": "South East", "reading": "South East",
    "southampton": "South East", "portsmouth": "South East", "canterbury": "South East",
    "guildford": "South East", "milton keynes": "South East", "slough": "South East",
    "crawley": "South East", "maidstone": "South East", "woking": "South East",
    "basingstoke": "South East", "aylesbury": "South East",
    "norwich": "East of England", "cambridge": "East of England",
    "ipswich": "East of England", "colchester": "East of England",
    "chelmsford": "East of England", "peterborough": "East of England",
    "luton": "East of England", "southend": "East of England",
    "st albans": "East of England", "watford": "East of England",
    "nottingham": "East Midlands", "leicester": "East Midlands",
    "derby": "East Midlands", "lincoln": "East Midlands",
    "northampton": "East Midlands",
    "edinburgh": "Scotland", "glasgow": "Scotland", "aberdeen": "Scotland",
    "dundee": "Scotland", "inverness": "Scotland", "stirling": "Scotland",
    "perth": "Scotland",
    "cardiff": "Wales", "swansea": "Wales", "newport": "Wales",
    "wrexham": "Wales", "bangor": "Wales",
    "belfast": "Northern Ireland", "derry": "Northern Ireland",
    "lisburn": "Northern Ireland", "newry": "Northern Ireland",
}

# Mapping from ONS region names (postcodes.io) to BTR Directory region names
ONS_TO_BTR_REGION: dict[str, str] = {
    "London": "London",
    "South East": "South East",
    "South West": "South West",
    "East of England": "East of England",
    "East Midlands": "East Midlands",
    "West Midlands": "West Midlands",
    "North West": "North West",
    "North East": "North East",
    "Yorkshire and the Humber": "Yorkshire and The Humber",  # lowercase "the" -> capital "The"
    "Yorkshire and The Humber": "Yorkshire and The Humber",
    "Scotland": "Scotland",
    "Wales": "Wales",
    "Northern Ireland": "Northern Ireland",
}


def postcode_to_region(postcode: str) -> Optional[str]:
    """Map a UK postcode to a BTR region using the prefix lookup table."""
    cleaned = postcode.upper().replace(" ", "")
    # Try 2-letter prefix first, then 1-letter
    two_letter = re.match(r"^([A-Z]{2})", cleaned)
    one_letter = re.match(r"^([A-Z])", cleaned)

    if two_letter and two_letter.group(1) in POSTCODE_REGION_MAP:
        return POSTCODE_REGION_MAP[two_letter.group(1)]
    if one_letter and one_letter.group(1) in POSTCODE_REGION_MAP:
        return POSTCODE_REGION_MAP[one_letter.group(1)]
    return None


def city_to_region(city: str) -> Optional[str]:
    """Map a city/town name to a BTR region."""
    return CITY_REGION_MAP.get(city.lower().strip())


def map_ons_to_btr_region(ons_region: Optional[str], country: Optional[str]) -> Optional[str]:
    """Map an ONS region name or country from postcodes.io to BTR Directory region."""
    if ons_region and ons_region in ONS_TO_BTR_REGION:
        return ONS_TO_BTR_REGION[ons_region]
    # Fallback: try country for Scotland, Wales, Northern Ireland
    if country:
        country_map = {
            "Scotland": "Scotland",
            "Wales": "Wales",
            "Northern Ireland": "Northern Ireland",
        }
        if country in country_map:
            return country_map[country]
    return None


async def lookup_postcode(postcode: str) -> PostcodeLookup:
    """Look up a UK postcode via postcodes.io API. Returns coordinates and region."""
    cleaned = postcode.strip().upper().replace(" ", "")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{POSTCODES_IO_BASE}/postcodes/{cleaned}")
            if resp.status_code == 200:
                data = resp.json()["result"]
                region = map_ons_to_btr_region(
                    data.get("region"),
                    data.get("country"),
                )
                return PostcodeLookup(
                    postcode=data["postcode"],
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    region=region,
                    admin_district=data.get("admin_district"),
                    valid=True,
                )
            return PostcodeLookup(postcode=postcode, valid=False)
        except Exception:
            return PostcodeLookup(postcode=postcode, valid=False)


def normalize_postcode(postcode: Optional[str]) -> str:
    """Normalize a postcode for comparison (uppercase, no spaces)."""
    if not postcode:
        return ""
    return postcode.upper().replace(" ", "").strip()
