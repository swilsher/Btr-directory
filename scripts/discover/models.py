from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class Confidence(Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


VALID_STATUSES = ["In Planning", "Under Construction", "Operational"]
VALID_DEVELOPMENT_TYPES = ["Multifamily", "Single Family"]
VALID_REGIONS = [
    "London", "South East", "South West", "East of England",
    "East Midlands", "West Midlands", "North West", "North East",
    "Yorkshire and The Humber", "Scotland", "Wales", "Northern Ireland",
]


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    query: str


@dataclass
class CrawlResult:
    url: str
    success: bool
    content: str
    title: str
    error: Optional[str] = None


@dataclass
class DiscoveredDevelopment:
    """A BTR development discovered from web search."""
    name: str
    slug: str
    development_type: str = "Multifamily"
    operator_name: Optional[str] = None
    asset_owner_name: Optional[str] = None
    area: Optional[str] = None
    region: Optional[str] = None
    postcode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    number_of_units: Optional[int] = None
    status: Optional[str] = None
    completion_date: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None

    # Discovery metadata
    source_urls: list[str] = field(default_factory=list)
    confidence: Confidence = Confidence.LOW
    confidence_score: float = 0.0
    is_new: bool = True
    notes: list[str] = field(default_factory=list)
