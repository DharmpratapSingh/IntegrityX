"""
Input sanitization utilities for preventing XSS, injection attacks, and data validation.

This module provides comprehensive data sanitization for extracted document fields
to ensure security before auto-populating forms or storing in database.
"""

import re
import html
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class DataSanitizer:
    """
    Sanitize extracted data to prevent XSS and injection attacks.

    Features:
    - HTML/Script escaping
    - Pattern validation
    - Length limits
    - Type validation
    - Null byte removal
    """

    # Allowed character patterns per field type
    ALLOWED_PATTERNS = {
        'loan_id': r'^[A-Za-z0-9_-]+$',
        'borrower_name': r'^[A-Za-z\s\'-\.]+$',
        'property_address': r'^[A-Za-z0-9\s,.\-#]+$',
        'loan_amount': r'^\d+(\.\d{1,2})?$',
        'interest_rate': r'^\d+(\.\d{1,4})?$',
        'loan_term': r'^\d+$'
    }

    # Maximum field lengths
    MAX_LENGTHS = {
        'loan_id': 50,
        'borrower_name': 100,
        'property_address': 200,
        'loan_amount': 20,
        'interest_rate': 10,
        'loan_term': 10,
        'default': 500
    }

    @staticmethod
    def sanitize_string(value: str, field_name: str = 'default') -> str:
        """
        Sanitize a string value to prevent injection attacks.

        Args:
            value: Input string to sanitize
            field_name: Field name for context-specific sanitization

        Returns:
            Sanitized string safe for display and storage
        """
        if not isinstance(value, str):
            value = str(value)

        # 1. Trim whitespace
        value = value.strip()

        # 2. Enforce length limits
        max_len = DataSanitizer.MAX_LENGTHS.get(
            field_name,
            DataSanitizer.MAX_LENGTHS['default']
        )
        if len(value) > max_len:
            logger.warning(f"Field {field_name} truncated from {len(value)} to {max_len} chars")
            value = value[:max_len]

        # 3. Remove null bytes and control characters
        value = value.replace('\x00', '')
        value = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', value)

        # 4. HTML escape to prevent XSS
        value = html.escape(value, quote=True)

        # 5. Pattern validation (if pattern defined for field)
        if field_name in DataSanitizer.ALLOWED_PATTERNS:
            # Unescape to check pattern (pattern check on original chars)
            unescaped = html.unescape(value)
            pattern = DataSanitizer.ALLOWED_PATTERNS[field_name]

            if not re.match(pattern, unescaped):
                logger.warning(f"Field {field_name} failed pattern validation")
                # Strip all non-alphanumeric except allowed chars
                if field_name == 'borrower_name':
                    value = re.sub(r'[^A-Za-z\s\-\'.]', '', unescaped)
                elif field_name == 'property_address':
                    value = re.sub(r'[^A-Za-z0-9\s,.\-#]', '', unescaped)
                elif field_name == 'loan_id':
                    value = re.sub(r'[^A-Za-z0-9_-]', '', unescaped)
                else:
                    value = re.sub(r'[^\w\s\-\.,#]', '', unescaped)

                # Re-escape after cleaning
                value = html.escape(value, quote=True)

        return value

    @staticmethod
    def sanitize_number(value: Any, field_name: str) -> str:
        """
        Sanitize numeric values.

        Args:
            value: Input value (string or number)
            field_name: Field name for context

        Returns:
            Sanitized numeric string
        """
        # Convert to string
        value_str = str(value).strip()

        # For monetary amounts or percentages
        if field_name in ['loan_amount', 'interest_rate']:
            # Allow only digits and one decimal point
            value_str = re.sub(r'[^\d.]', '', value_str)

            # Ensure only one decimal point
            parts = value_str.split('.')
            if len(parts) > 2:
                value_str = parts[0] + '.' + ''.join(parts[1:])

            # Limit decimal places
            if '.' in value_str:
                integer_part, decimal_part = value_str.split('.')
                if field_name == 'loan_amount':
                    decimal_part = decimal_part[:2]  # Max 2 decimal places
                else:  # interest_rate
                    decimal_part = decimal_part[:4]  # Max 4 decimal places
                value_str = f"{integer_part}.{decimal_part}"

            # Validate range
            try:
                num = float(value_str) if value_str else 0
                if field_name == 'loan_amount' and num < 0:
                    value_str = '0'
                elif field_name == 'loan_amount' and num > 100000000:  # 100M max
                    logger.warning(f"Loan amount {num} exceeds maximum")
                    value_str = '100000000'
                elif field_name == 'interest_rate' and (num < 0 or num > 100):
                    logger.warning(f"Interest rate {num} out of range")
                    value_str = '0'
            except ValueError:
                value_str = '0'

        else:
            # For integers (like loan_term)
            value_str = re.sub(r'[^\d]', '', value_str)

            # Validate range for term
            if field_name == 'loan_term':
                try:
                    term = int(value_str) if value_str else 0
                    if term < 0:
                        value_str = '0'
                    elif term > 360:  # 30 years max
                        logger.warning(f"Loan term {term} exceeds maximum")
                        value_str = '360'
                except ValueError:
                    value_str = '0'

        return value_str

    @staticmethod
    def sanitize_field(field_name: str, value: Any) -> str:
        """
        Sanitize a field based on its type.

        Args:
            field_name: Name of the field
            value: Field value (any type)

        Returns:
            Sanitized value as string
        """
        if value is None or value == '':
            return ''

        # Numeric fields
        if field_name in ['loan_amount', 'interest_rate', 'loan_term']:
            return DataSanitizer.sanitize_number(value, field_name)

        # String fields
        return DataSanitizer.sanitize_string(value, field_name)

    @staticmethod
    def sanitize_extracted_data(extracted_fields: Dict[str, Any]) -> Dict[str, str]:
        """
        Sanitize all extracted fields from document.

        Args:
            extracted_fields: Dictionary of extracted field values

        Returns:
            Dictionary of sanitized field values (all strings)
        """
        sanitized = {}

        for field_name, value in extracted_fields.items():
            try:
                sanitized[field_name] = DataSanitizer.sanitize_field(field_name, value)
            except Exception as e:
                # Log error but don't expose to user
                logger.error(f"Error sanitizing field {field_name}: {e}")
                sanitized[field_name] = ''

        return sanitized

    @staticmethod
    def validate_file_content(content: bytes, max_size: int = 10 * 1024 * 1024) -> bool:
        """
        Validate file content size.

        Args:
            content: File content as bytes
            max_size: Maximum allowed size in bytes (default 10MB)

        Returns:
            True if valid, False otherwise
        """
        if len(content) > max_size:
            logger.warning(f"File content size {len(content)} exceeds maximum {max_size}")
            return False
        return True


# Example usage and testing
if __name__ == "__main__":
    # Test cases
    test_cases = {
        'xss_attack': {
            'borrower_name': '<script>alert("XSS")</script>',
            'expected': '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
        },
        'sql_injection': {
            'loan_id': "'; DROP TABLE artifacts; --",
            'expected': ''  # All invalid chars removed
        },
        'buffer_overflow': {
            'borrower_name': 'A' * 1000,
            'expected': 'A' * 100  # Truncated to max length
        },
        'valid_data': {
            'loan_amount': '450000.50',
            'expected': '450000.50'
        }
    }

    print("Testing DataSanitizer:")
    print("=" * 50)

    for test_name, test_data in test_cases.items():
        print(f"\nTest: {test_name}")
        for field, value in test_data.items():
            if field != 'expected':
                sanitized = DataSanitizer.sanitize_field(field, value)
                print(f"  {field}: '{value}' -> '{sanitized}'")
                if 'expected' in test_data:
                    status = "✅" if sanitized == test_data['expected'] else "❌"
                    print(f"  {status} Expected: '{test_data['expected']}'")
