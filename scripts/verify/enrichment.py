from typing import Optional

from models import Confidence, FieldComparison, FieldStatus, PostcodeLookup


def suggest_enrichments(
    listing: dict,
    llm_analysis: Optional[dict],
    postcode_data: Optional[PostcodeLookup],
) -> list[FieldComparison]:
    """
    For fields that are NULL in the database, suggest values from postcode data and LLM analysis.
    Returns additional FieldComparison entries for gap-filling suggestions.
    These supplement (not replace) the comparator's field comparisons.
    """
    suggestions = []

    # Postcode -> lat/lng enrichment
    if not listing.get("latitude") and postcode_data and postcode_data.valid and postcode_data.latitude:
        suggestions.append(FieldComparison(
            "latitude", None, str(postcode_data.latitude),
            FieldStatus.GAP_FILLED, Confidence.HIGH,
            "postcodes.io", "Derived from postcode"
        ))
    if not listing.get("longitude") and postcode_data and postcode_data.valid and postcode_data.longitude:
        suggestions.append(FieldComparison(
            "longitude", None, str(postcode_data.longitude),
            FieldStatus.GAP_FILLED, Confidence.HIGH,
            "postcodes.io", "Derived from postcode"
        ))

    # Postcode -> region enrichment
    if not listing.get("region") and postcode_data and postcode_data.valid and postcode_data.region:
        suggestions.append(FieldComparison(
            "region", None, postcode_data.region,
            FieldStatus.GAP_FILLED, Confidence.HIGH,
            "postcodes.io", "Derived from postcode"
        ))

    # LLM-based enrichments for empty fields
    if llm_analysis:
        llm_fields = [
            ("number_of_units", "number_of_units"),
            ("status", "status"),
            ("description", "description"),
            ("area", "area"),
            ("completion_date", "completion_date"),
            ("development_type", "development_type"),
            ("website_url", "website_url"),
        ]
        for db_field, llm_field in llm_fields:
            stored = listing.get(db_field)
            if stored is not None and str(stored).strip() != "":
                continue  # Already has a value, skip

            found = llm_analysis.get(llm_field)
            if found is None or str(found).strip() == "":
                continue

            confidence_key = f"{llm_field}_confidence"
            confidence_str = llm_analysis.get(confidence_key, "LOW")
            try:
                confidence = Confidence[confidence_str.upper()]
            except (KeyError, AttributeError):
                confidence = Confidence.LOW

            suggestions.append(FieldComparison(
                db_field, None, str(found),
                FieldStatus.GAP_FILLED, confidence,
                "llm_analysis", f"Extracted from web content by LLM (confidence: {confidence.value})"
            ))

        # Operator enrichment
        op = listing.get("operator")
        if (not op or not isinstance(op, dict) or not op.get("name")):
            found_op = llm_analysis.get("operator_name")
            if found_op:
                confidence_str = llm_analysis.get("operator_name_confidence", "LOW")
                try:
                    confidence = Confidence[confidence_str.upper()]
                except (KeyError, AttributeError):
                    confidence = Confidence.LOW
                suggestions.append(FieldComparison(
                    "operator", None, found_op,
                    FieldStatus.GAP_FILLED, confidence,
                    "llm_analysis", f"Operator identified from web content"
                ))

        # Asset owner enrichment
        ao = listing.get("asset_owner")
        if (not ao or not isinstance(ao, dict) or not ao.get("name")):
            found_ao = llm_analysis.get("asset_owner_name")
            if found_ao:
                confidence_str = llm_analysis.get("asset_owner_name_confidence", "LOW")
                try:
                    confidence = Confidence[confidence_str.upper()]
                except (KeyError, AttributeError):
                    confidence = Confidence.LOW
                suggestions.append(FieldComparison(
                    "asset_owner", None, found_ao,
                    FieldStatus.GAP_FILLED, confidence,
                    "llm_analysis", f"Asset owner identified from web content"
                ))

    return suggestions
