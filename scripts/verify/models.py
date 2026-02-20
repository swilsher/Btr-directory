from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class FieldStatus(Enum):
    MATCH = "MATCH"
    DISCREPANCY = "DISCREPANCY"
    GAP_FILLED = "GAP_FILLED"
    NOT_FOUND = "NOT_FOUND"
    STATUS_CHANGE = "STATUS_CHANGE"


class Confidence(Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class CrawlResult:
    url: str
    success: bool
    status_code: Optional[int]
    content: str
    title: str
    error: Optional[str] = None
    is_dead_link: bool = False
    redirect_url: Optional[str] = None


@dataclass
class FieldComparison:
    field_name: str
    stored_value: Optional[str]
    found_value: Optional[str]
    status: FieldStatus
    confidence: Confidence
    source_url: str = ""
    notes: str = ""


@dataclass
class ListingVerification:
    development_id: str
    development_name: str
    development_slug: str
    area: str
    operator_name: str
    asset_owner_name: str
    website_url: Optional[str]
    field_comparisons: list[FieldComparison] = field(default_factory=list)
    dead_links: list[str] = field(default_factory=list)
    rebranding_detected: bool = False
    rebranding_notes: str = ""
    crawl_errors: list[str] = field(default_factory=list)
    sources_checked: int = 0
    overall_confidence: Confidence = Confidence.LOW
    notes: str = ""


@dataclass
class PostcodeLookup:
    postcode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None
    admin_district: Optional[str] = None
    valid: bool = False


# Fields to verify for each listing
VERIFY_FIELDS = [
    "operator",
    "asset_owner",
    "number_of_units",
    "status",
    "development_type",
    "region",
    "postcode",
    "website_url",
    "description",
    "latitude",
    "longitude",
    "completion_date",
]

# Valid status values
VALID_STATUSES = ["In Planning", "Under Construction", "Operational"]

# Valid development types
VALID_DEVELOPMENT_TYPES = ["Multifamily", "Single Family"]

# Valid UK regions (matching database CHECK constraint)
VALID_REGIONS = [
    "London",
    "South East",
    "South West",
    "East of England",
    "East Midlands",
    "West Midlands",
    "North West",
    "North East",
    "Yorkshire and The Humber",
    "Scotland",
    "Wales",
    "Northern Ireland",
]
