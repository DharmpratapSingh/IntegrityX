#!/usr/bin/env python3
"""
Test the sanitizer to see if it's removing our extracted values
"""
import sys
sys.path.insert(0, 'backend')

from src.security.sanitizer import DataSanitizer

# Test with actual extracted data from the intelligent extractor
test_data = {
    'loan_id': 'f86770d7-d769-3f4a-98f8-cc540199ad07',
    'borrower_name': 'Alexandria Kilback',
    'property_address': '4269 Schaden Path Apt. 295, Port Era, New Jersey 21043, Senegal',
    'loan_amount': '50000',
    'interest_rate': '6.66',
    'loan_term': '480'
}

print("=" * 80)
print("Testing DataSanitizer with Extracted Values")
print("=" * 80)

print("\nBefore Sanitization:")
for field, value in test_data.items():
    print(f"  {field}: '{value}'")

print("\nSanitizing...")
sanitized = DataSanitizer.sanitize_extracted_data(test_data)

print("\nAfter Sanitization:")
for field, value in sanitized.items():
    original = test_data.get(field, '')
    status = "✅" if value else "❌ EMPTY!"
    print(f"  {field}: '{value}' {status}")
    if not value and original:
        print(f"    ⚠️  LOST: Original was '{original}'")

print("\n" + "=" * 80)

# Test if empty
if all(v == '' for v in sanitized.values()):
    print("❌ ALL FIELDS WERE REMOVED BY SANITIZER!")
    print("\nDiagnosing individual field sanitization...")

    for field_name, original_value in test_data.items():
        print(f"\n--- Testing {field_name} ---")
        print(f"Original: '{original_value}'")
        result = DataSanitizer.sanitize_field(field_name, original_value)
        print(f"Result: '{result}'")

        # Check pattern validation
        import re
        if field_name in DataSanitizer.ALLOWED_PATTERNS:
            pattern = DataSanitizer.ALLOWED_PATTERNS[field_name]
            matches = re.match(pattern, original_value)
            print(f"Pattern: {pattern}")
            print(f"Matches: {matches is not None}")
            if not matches:
                print(f"❌ PATTERN MISMATCH - This is why it was removed!")
else:
    print("✅ Some fields survived sanitization")

print("=" * 80)
