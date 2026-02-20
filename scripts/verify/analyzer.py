import json
import re
from typing import Optional

import anthropic

from config import Config


class ClaudeAnalyzer:
    """Analyze crawled web content using Claude API to extract structured development info."""

    def __init__(self, config: Config):
        self.client = anthropic.Anthropic(api_key=config.anthropic_api_key)
        self.model = config.llm_model

    def extract_development_info(
        self,
        content: str,
        listing_name: str,
        listing_area: str,
    ) -> Optional[dict]:
        """
        Extract structured development information from crawled page content.
        Returns a dict with extracted fields and per-field confidence.
        """
        if not content or len(content.strip()) < 50:
            return None

        # Truncate to manage token costs
        truncated = content[:8000]

        prompt = f"""Analyze this webpage content and extract information about the BTR (Build to Rent) development called "{listing_name}" in {listing_area or "the UK"}.

Return a JSON object with ONLY the fields you find explicit evidence for. Do not guess or infer values.

Fields to extract:
- "name": The development's current name (string)
- "operator_name": The company operating/managing the development (string)
- "asset_owner_name": The company that owns the development/asset (string, may differ from operator)
- "number_of_units": Total number of residential units (integer)
- "status": One of "In Planning", "Under Construction", or "Operational" (string)
- "postcode": UK postcode (string)
- "area": City or town (string)
- "region": UK region — MUST be exactly one of: "London", "South East", "South West", "East of England", "East Midlands", "West Midlands", "North West", "North East", "Yorkshire and The Humber", "Scotland", "Wales", "Northern Ireland" (string)
- "completion_date": Expected or actual completion date (string, ISO format YYYY-MM-DD if possible)
- "description": A brief description of the development (string, max 200 words)
- "website_url": The development's website URL (string)
- "development_type": "Multifamily" or "Single Family" (string)

For each field you include, also add a confidence field like "name_confidence": "HIGH" / "MEDIUM" / "LOW".
- HIGH: explicitly stated on the page
- MEDIUM: strongly implied or partially stated
- LOW: inferred from context

Return ONLY valid JSON. No explanation text.

Webpage content:
{truncated}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )
            return self._parse_response(response.content[0].text)
        except anthropic.RateLimitError:
            print("    Claude API rate limited — skipping LLM analysis for this listing")
            return None
        except Exception as e:
            print(f"    Claude API error: {e}")
            return None

    def _parse_response(self, text: str) -> Optional[dict]:
        """Parse the LLM response, handling common JSON formatting issues."""
        # Try direct JSON parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON from markdown code block
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding first { ... } block
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        return None


def create_analyzer(config: Config) -> Optional[ClaudeAnalyzer]:
    """Create an analyzer instance. Returns None if API key is not configured."""
    if not config.anthropic_api_key:
        return None
    return ClaudeAnalyzer(config)
