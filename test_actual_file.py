#!/usr/bin/env python3
"""
Test intelligent extractor with user's actual retest file
"""
import json
import sys
sys.path.insert(0, 'backend')

from src.intelligent_extractor import IntelligentExtractor
from src.security.sanitizer import DataSanitizer

# Load the actual test file
with open('tmp/auto_populate_tests/loan_normal_retest.json', 'r') as f:
    test_data = json.load(f)

print("=" * 80)
print("Testing with Actual Retest File")
print("=" * 80)

# Step 1: Extract using intelligent extractor
print("\nStep 1: Intelligent Extraction")
print("-" * 80)
extractor = IntelligentExtractor()
result = extractor.extract_from_document(test_data)

print(f"Extracted fields: {len(result['extracted_fields'])}")
for field, value in result['extracted_fields'].items():
    confidence = result['confidence_scores'].get(field, 0.0)
    print(f"  • {field}: '{value}' ({confidence:.0%})")

print(f"\nOverall Confidence: {result['overall_confidence']:.2%}")

# Step 2: Apply sanitization (as done in document_intelligence.py)
print("\nStep 2: Security Sanitization")
print("-" * 80)
sanitized_fields = DataSanitizer.sanitize_extracted_data(result['extracted_fields'])

print(f"Sanitized fields: {len(sanitized_fields)}")
for field, value in sanitized_fields.items():
    status = "✅" if value else "❌ EMPTY!"
    print(f"  • {field}: '{value}' {status}")

# Step 3: Build the return structure (as done in _extract_from_json)
print("\nStep 3: Build API Response Structure")
print("-" * 80)
api_response = {
    'document_type': 'json',
    'extracted_fields': sanitized_fields,
    'confidence': result['overall_confidence'],
    'confidence_scores': result.get('confidence_scores', {}),
    'document_classification': 'loan_application'
}

print(f"API Response extracted_fields: {api_response['extracted_fields']}")
print(f"Is empty? {len(api_response['extracted_fields']) == 0}")

# Final check
print("\n" + "=" * 80)
if api_response['extracted_fields']:
    print("✅ SUCCESS: Fields would be returned to API")
else:
    print("❌ FAILURE: Empty fields would be returned to API")
print("=" * 80)
