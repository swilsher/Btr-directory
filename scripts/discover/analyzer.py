import json
import re
from typing import Optional

import anthropic

from models import VALID_REGIONS, VALID_STATUSES, VALID_DEVELOPMENT_TYPES


DISCOVERY_PROMPT = """Analyze this webpage content and extract ALL Build to Rent (BTR) developments mentioned.

For each development found, return a JSON object with these fields (only include fields with explicit evidence):
- "name": The development's name (string, REQUIRED)
- "operator_name": The company operating/managing the development (string)
- "asset_owner_name": The company that owns the development/asset (string)
- "number_of_units": Total residential units (integer)
- "status": MUST be one of: "In Planning", "Under Construction", "Operational"
- "postcode": UK postcode (string)
- "area": City or town name (string)
- "region": MUST be exactly one of: "London", "South East", "South West", "East of England", "East Midlands", "West Midlands", "North West", "North East", "Yorkshire and The Humber", "Scotland", "Wales", "Northern Ireland"
- "completion_date": Expected/actual completion date in YYYY-MM-DD format if possible, or YYYY if only year known
- "description": Brief factual description, max 80 words (string)
- "website_url": The development's own website URL if mentioned (string)
- "development_type": "Multifamily" (apartments/flats) or "Single Family" (houses)

Return a JSON object with a "developments" array:
{{
  "developments": [
    {{"name": "The Quarters", "area": "Manchester", "number_of_units": 350, "operator_name": "Grainger", "status": "Under Construction", ...}},
    {{"name": "Alder Wharf", "area": "London", ...}}
  ]
}}

If no BTR developments are found, return: {{"developments": []}}

IMPORTANT:
- Only include actual named BTR (Build to Rent) developments. Do NOT include generic mentions of BTR as a concept.
- Each development MUST have a name. Skip unnamed references.
- Do NOT guess or infer fields without evidence on the page.

Return ONLY valid JSON. No explanation text.

Source URL: {source_url}

Webpage content:
{content}"""


class DiscoveryAnalyzer:
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def extract_developments(self, content: str, source_url: str) -> list[dict]:
        """Extract ALL BTR developments mentioned in crawled content."""
        if not content or len(content.strip()) < 100:
            return []

        truncated = content[:12000]
        prompt = DISCOVERY_PROMPT.format(content=truncated, source_url=source_url)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )
        except anthropic.RateLimitError:
            print("    Claude API rate limited -- skipping this page")
            return []
        except Exception as e:
            print(f"    Claude API error: {e}")
            return []

        parsed = _parse_response(response.content[0].text)
        if not parsed or "developments" not in parsed:
            return []

        developments = parsed["developments"]
        if not isinstance(developments, list):
            return []

        # Validate and clean each development
        cleaned = []
        for dev in developments:
            if not isinstance(dev, dict):
                continue
            name = dev.get("name", "").strip()
            if not name or len(name) < 3:
                continue

            # Validate constrained fields
            if dev.get("region") and dev["region"] not in VALID_REGIONS:
                dev["region"] = None
            if dev.get("status") and dev["status"] not in VALID_STATUSES:
                dev["status"] = None
            if dev.get("development_type") and dev["development_type"] not in VALID_DEVELOPMENT_TYPES:
                dev["development_type"] = "Multifamily"

            dev["_source_url"] = source_url
            cleaned.append(dev)

        return cleaned


def _parse_response(text: str) -> Optional[dict]:
    """Parse Claude's JSON response, handling various formats."""
    # Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding outermost braces
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    return None
