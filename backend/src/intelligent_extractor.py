"""
Intelligent Document Data Extractor

This module provides smart, flexible data extraction that works with ANY document structure.
Unlike the basic extractor, this uses multiple strategies to find relevant data:

1. Deep JSON traversal (finds fields at any nesting level)
2. Fuzzy field matching (recognizes similar field names)
3. Pattern recognition (identifies data by format/content)
4. Semantic analysis (understands what data represents)
5. Fallback strategies (multiple ways to find each field)

Author: IntegrityX Team
"""

import re
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class IntelligentExtractor:
    """
    Smart document data extractor that works with any JSON structure.

    Features:
    - Searches nested structures automatically
    - Fuzzy field name matching
    - Pattern-based value detection
    - Multiple extraction strategies
    - Confidence scoring
    """

    def __init__(self):
        """Initialize the intelligent extractor with field mappings and patterns."""

        # Field name variations (fuzzy matching)
        self.field_variations = {
            'loan_id': [
                'loan_id', 'loanid', 'loan_number', 'loannumber', 'loan_no',
                'application_id', 'applicationid', 'app_id', 'id', 'loan_reference',
                'reference_number', 'loan_ref', 'application_number'
            ],
            'borrower_name': [
                'borrower_name', 'borrowername', 'borrower', 'name', 'full_name',
                'fullname', 'applicant_name', 'applicant', 'customer_name',
                'client_name', 'person_name', 'individual_name'
            ],
            'property_address': [
                'property_address', 'propertyaddress', 'address', 'property',
                'location', 'property_location', 'site_address', 'street_address',
                'property_addr', 'collateral_address', 'street'
            ],
            'loan_amount': [
                'loan_amount', 'loanamount', 'amount', 'loan_amt', 'principal',
                'requested_amount', 'request_amount', 'loan_value', 'financing_amount',
                'mortgage_amount', 'principal_amount', 'funding_amount'
            ],
            'interest_rate': [
                'interest_rate', 'interestrate', 'rate', 'apr', 'interest',
                'loan_rate', 'annual_rate', 'percentage_rate', 'rate_percent',
                'interest_percent', 'apr_rate'
            ],
            'loan_term': [
                'loan_term', 'loanterm', 'term', 'duration', 'period',
                'loan_duration', 'loan_period', 'term_months', 'term_years',
                'repayment_period', 'amortization_period', 'loan_length'
            ]
        }

        # Value pattern recognizers (regex patterns to identify data by format)
        self.value_patterns = {
            'loan_id': [
                r'^[A-Z]{2,4}-?\d{4,10}$',  # e.g., LA-2025-001234, LOAN001234
                r'^[A-Z]+\d+$',              # e.g., LOAN001, APP123
                r'^\d{6,12}$'                # e.g., 20250001
            ],
            'loan_amount': [
                r'^\$?\d{1,3}(,?\d{3})*(\.\d{2})?$',  # e.g., $450,000.00, 450000
                r'^\d{4,10}(\.\d{1,2})?$'              # e.g., 450000.50
            ],
            'interest_rate': [
                r'^\d{1,2}\.\d{1,4}%?$',   # e.g., 6.75%, 6.7500
                r'^\d{1,2}%?$'              # e.g., 7%, 7
            ],
            'loan_term': [
                r'^\d{1,3}$',               # e.g., 360, 60
                r'^\d{1,2}\s*(months?|years?)$'  # e.g., 30 years, 60 months
            ]
        }

        # Common nested paths to check (performance optimization)
        self.common_paths = {
            'loan_id': [
                ['loan_details', 'loan_id'],
                ['application', 'id'],
                ['metadata', 'loan_id'],
                ['loan_id']  # Also check root level
            ],
            'borrower_name': [
                ['borrower_information', 'personal_details', 'full_name'],
                ['borrower', 'full_name'],  # Common in FakerAPI format
                ['borrower', 'name'],
                ['applicant', 'name'],
                ['applicant', 'full_name'],
                ['personal_details', 'name'],
                ['personal_details', 'full_name']
            ],
            'property_address': [
                ['property_information', 'property_address', 'street'],
                ['property', 'address'],
                ['collateral', 'address'],
                ['property_address']  # Also check root level
            ],
            'loan_amount': [
                ['loan_details', 'loan_amount'],
                ['financial_information', 'loan_amount'],
                ['loan_amount'],  # Also check root level
                ['amount']
            ],
            'interest_rate': [
                ['loan_details', 'interest_rate'],
                ['rate_information', 'interest_rate'],
                ['interest_rate']  # Also check root level
            ],
            'loan_term': [
                ['loan_details', 'loan_term_months'],
                ['loan_details', 'term'],
                ['term_information', 'months'],
                ['loan_term_months'],  # Also check root level
                ['loan_term']
            ]
        }

    def extract_from_document(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract data from any JSON document structure.

        Args:
            json_data: The JSON document data

        Returns:
            Dictionary with extracted fields and confidence scores
        """
        extracted = {}
        confidence_scores = {}

        for field_name in self.field_variations.keys():
            value, confidence = self._extract_field_intelligent(json_data, field_name)

            if value:
                extracted[field_name] = value
                confidence_scores[field_name] = confidence
                logger.info(f"Extracted {field_name}: {value} (confidence: {confidence:.2f})")

        return {
            'extracted_fields': extracted,
            'confidence_scores': confidence_scores,
            'overall_confidence': self._calculate_overall_confidence(confidence_scores)
        }

    def _extract_field_intelligent(
        self,
        json_data: Dict[str, Any],
        field_name: str
    ) -> Tuple[Optional[str], float]:
        """
        Intelligently extract a field using multiple strategies.

        Strategies (in order of priority):
        1. Check common nested paths
        2. Fuzzy field name matching (deep search)
        3. Pattern recognition on values
        4. Semantic analysis

        Returns:
            Tuple of (extracted_value, confidence_score)
        """

        # Strategy 1: Check common nested paths first (fast)
        if field_name in self.common_paths:
            for path in self.common_paths[field_name]:
                value = self._get_nested_value(json_data, path)
                if value:
                    return str(value), 0.95  # High confidence for known paths

        # Strategy 2: Fuzzy field name matching (deep search)
        value, confidence = self._fuzzy_field_search(json_data, field_name)
        if value and confidence > 0.7:
            return value, confidence

        # Strategy 3: Pattern recognition on all values
        pattern_value, pattern_confidence = self._pattern_based_search(
            json_data,
            field_name
        )
        if pattern_value and pattern_confidence > 0.6:
            # If we found something via pattern but lower confidence than fuzzy,
            # compare and take the better one
            if confidence > pattern_confidence:
                return value, confidence
            return pattern_value, pattern_confidence

        # Return best result found (if any)
        if value:
            return value, confidence

        return None, 0.0

    def _get_nested_value(self, data: Any, path: List[str]) -> Optional[Any]:
        """
        Get value from nested dictionary using path.

        Args:
            data: Dictionary or nested structure
            path: List of keys representing the path

        Returns:
            Value if found, None otherwise
        """
        current = data

        for key in path:
            if isinstance(current, dict):
                # Try exact key match
                if key in current:
                    current = current[key]
                else:
                    # Try case-insensitive match
                    for dict_key in current.keys():
                        if isinstance(dict_key, str) and dict_key.lower() == key.lower():
                            current = current[dict_key]
                            break
                    else:
                        return None
            else:
                return None

        return current

    def _fuzzy_field_search(
        self,
        json_data: Dict[str, Any],
        target_field: str
    ) -> Tuple[Optional[str], float]:
        """
        Search for field using fuzzy name matching at any nesting level.

        Args:
            json_data: The JSON data
            target_field: The field we're looking for

        Returns:
            Tuple of (value, confidence_score)
        """
        variations = self.field_variations.get(target_field, [target_field])
        best_value = None
        best_confidence = 0.0

        def search_recursive(obj: Any, path: str = '') -> None:
            nonlocal best_value, best_confidence

            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key

                    # Check if this key matches any variation
                    confidence = self._calculate_field_match_confidence(
                        key,
                        variations
                    )

                    if confidence > best_confidence and value is not None:
                        # Validate the value makes sense for this field type
                        if self._validate_value_for_field(target_field, value):
                            best_value = str(value)
                            best_confidence = confidence

                    # Recurse into nested structures
                    if isinstance(value, (dict, list)):
                        search_recursive(value, current_path)

            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    search_recursive(item, f"{path}[{i}]")

        search_recursive(json_data)
        return best_value, best_confidence

    def _calculate_field_match_confidence(
        self,
        key: str,
        variations: List[str]
    ) -> float:
        """
        Calculate confidence that a field name matches what we're looking for.

        Uses fuzzy string matching (Levenshtein distance).
        """
        key_lower = str(key).lower().replace('_', '').replace('-', '').replace(' ', '')

        best_ratio = 0.0
        for variation in variations:
            var_lower = variation.lower().replace('_', '').replace('-', '').replace(' ', '')
            ratio = SequenceMatcher(None, key_lower, var_lower).ratio()
            best_ratio = max(best_ratio, ratio)

        return best_ratio

    def _validate_value_for_field(self, field_name: str, value: Any) -> bool:
        """
        Validate that a value makes sense for a given field.

        Args:
            field_name: The field type
            value: The value to validate

        Returns:
            True if value is valid for this field type
        """
        if value is None or value == '':
            return False

        value_str = str(value).strip()

        # Check against known patterns for this field
        if field_name in self.value_patterns:
            for pattern in self.value_patterns[field_name]:
                if re.match(pattern, value_str, re.IGNORECASE):
                    return True

        # Additional semantic validation
        if field_name == 'loan_amount':
            try:
                amount = float(str(value).replace(',', '').replace('$', ''))
                # Reasonable loan amount: $1,000 to $100,000,000
                return 1000 <= amount <= 100000000
            except (ValueError, TypeError):
                return False

        elif field_name == 'interest_rate':
            try:
                rate = float(str(value).replace('%', ''))
                # Reasonable interest rate: 0% to 50%
                return 0 <= rate <= 50
            except (ValueError, TypeError):
                return False

        elif field_name == 'loan_term':
            try:
                # Extract numeric part
                term_str = re.search(r'\d+', str(value))
                if term_str:
                    term = int(term_str.group())
                    # Reasonable term: 1 to 360 months (30 years)
                    return 1 <= term <= 360
            except (ValueError, TypeError):
                return False

        elif field_name == 'borrower_name':
            # Should be alphabetic with possible spaces, hyphens, apostrophes
            return bool(re.match(r"^[A-Za-z\s\-'.]+$", value_str)) and len(value_str) >= 2

        # Default: allow any non-empty string
        return len(value_str) > 0

    def _pattern_based_search(
        self,
        json_data: Dict[str, Any],
        target_field: str
    ) -> Tuple[Optional[str], float]:
        """
        Search for values that match expected patterns for this field type.

        This is useful when field names don't match but values do.
        """
        if target_field not in self.value_patterns:
            return None, 0.0

        patterns = self.value_patterns[target_field]
        candidates = []

        def search_values(obj: Any) -> None:
            if isinstance(obj, dict):
                for value in obj.values():
                    if isinstance(value, (dict, list)):
                        search_values(value)
                    elif value is not None:
                        value_str = str(value).strip()
                        # Check if value matches any pattern
                        for pattern in patterns:
                            if re.match(pattern, value_str, re.IGNORECASE):
                                candidates.append(value_str)
                                break
            elif isinstance(obj, list):
                for item in obj:
                    search_values(item)

        search_values(json_data)

        if candidates:
            # Return first match with moderate confidence
            # (lower than field name matching)
            return candidates[0], 0.65

        return None, 0.0

    def _calculate_overall_confidence(
        self,
        confidence_scores: Dict[str, float]
    ) -> float:
        """Calculate overall extraction confidence."""
        if not confidence_scores:
            return 0.0

        return sum(confidence_scores.values()) / len(confidence_scores)

    def format_extracted_address(self, json_data: Dict[str, Any]) -> Optional[str]:
        """
        Intelligently format address from various structures.

        Handles nested address objects like:
        {
          "street": "123 Main St",
          "city": "San Francisco",
          "state": "CA",
          "zip": "94102"
        }
        """
        address_parts = []

        # Try to find address components
        def search_address_parts(obj: Any, path: str = '') -> None:
            if isinstance(obj, dict):
                for key, value in obj.items():
                    key_lower = str(key).lower()

                    if 'street' in key_lower or 'address' in key_lower:
                        if isinstance(value, str) and value not in address_parts:
                            address_parts.append(value)
                    elif 'city' in key_lower:
                        if isinstance(value, str) and value not in address_parts:
                            address_parts.append(value)
                    elif 'state' in key_lower:
                        if isinstance(value, str) and value not in address_parts:
                            address_parts.append(value)
                    elif 'zip' in key_lower or 'postal' in key_lower:
                        if isinstance(value, str) and value not in address_parts:
                            address_parts.append(value)

                    if isinstance(value, dict):
                        search_address_parts(value, f"{path}.{key}")

        search_address_parts(json_data)

        if address_parts:
            return ', '.join(address_parts)

        return None


# Example usage and testing
if __name__ == "__main__":
    # Test with various document structures

    # Test Case 1: Flat structure (current working format)
    flat_doc = {
        "loan_id": "LA-2025-001234",
        "borrower_name": "Sarah Johnson",
        "loan_amount": "450000",
        "interest_rate": "6.75"
    }

    # Test Case 2: Nested structure (user's format)
    nested_doc = {
        "application_id": "LA-2025-001234",
        "borrower_information": {
            "personal_details": {
                "full_name": "Sarah Johnson"
            }
        },
        "loan_details": {
            "loan_amount": 450000,
            "interest_rate": 6.75,
            "loan_term_months": 360
        }
    }

    # Test Case 3: Different field names
    different_names = {
        "loanNumber": "LA-2025-001234",
        "applicant": {
            "name": "Sarah Johnson"
        },
        "financing": {
            "amount": "$450,000.00",
            "apr": "6.75%",
            "duration": "360 months"
        }
    }

    extractor = IntelligentExtractor()

    print("=" * 60)
    print("Intelligent Extractor Test Results")
    print("=" * 60)

    for i, doc in enumerate([flat_doc, nested_doc, different_names], 1):
        print(f"\nTest Case {i}:")
        print(f"Input: {json.dumps(doc, indent=2)[:200]}...")

        result = extractor.extract_from_document(doc)

        print(f"\nExtracted Fields:")
        for field, value in result['extracted_fields'].items():
            confidence = result['confidence_scores'][field]
            print(f"  {field}: '{value}' (confidence: {confidence:.2%})")

        print(f"\nOverall Confidence: {result['overall_confidence']:.2%}")
        print("-" * 60)
