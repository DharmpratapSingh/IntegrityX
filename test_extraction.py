#!/usr/bin/env python3
"""
Test the intelligent extractor with user's actual test data format
"""
import json
import sys
sys.path.insert(0, 'backend')

from src.intelligent_extractor import IntelligentExtractor

# Load the test file
with open('data/documents/test_faker_format.json', 'r') as f:
    test_data = json.load(f)

print("=" * 80)
print("Testing Intelligent Extractor with FakerAPI Format")
print("=" * 80)

print("\nInput Document:")
print(json.dumps(test_data, indent=2))

# Extract using intelligent extractor
extractor = IntelligentExtractor()
result = extractor.extract_from_document(test_data)

print("\n" + "=" * 80)
print("Extraction Results:")
print("=" * 80)

if result['extracted_fields']:
    print("\n✅ EXTRACTED FIELDS:")
    for field, value in result['extracted_fields'].items():
        confidence = result['confidence_scores'].get(field, 0.0)
        print(f"  • {field}: '{value}'")
        print(f"    Confidence: {confidence:.2%}")
else:
    print("\n❌ NO FIELDS EXTRACTED")

print(f"\nOverall Confidence: {result['overall_confidence']:.2%}")

# Check what we expected
expected_fields = ['loan_id', 'borrower_name', 'loan_amount', 'interest_rate', 'loan_term', 'property_address']
missing_fields = [f for f in expected_fields if f not in result['extracted_fields']]

if missing_fields:
    print(f"\n⚠️  MISSING FIELDS: {', '.join(missing_fields)}")
else:
    print("\n✅ ALL EXPECTED FIELDS EXTRACTED!")

print("=" * 80)
