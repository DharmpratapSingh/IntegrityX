#!/usr/bin/env python3
"""
Test the FULL extraction flow as it happens in main.py
"""
import json
import sys
sys.path.insert(0, 'backend')

from src.document_intelligence import DocumentIntelligenceService

# Load test file
with open('tmp/auto_populate_tests/loan_normal_retest.json', 'r') as f:
    content = f.read().encode('utf-8')

print("=" * 80)
print("Full Flow Test (Simulating API Endpoint)")
print("=" * 80)

# Create service instance
service = DocumentIntelligenceService()

# Step 1: Extract structured data (as done in main.py line 1983)
print("\nStep 1: extract_structured_data()")
print("-" * 80)
extracted_data = service.extract_structured_data(
    file_content=content,
    filename="loan_normal_retest.json",
    content_type="application/json"
)

print(f"document_type: {extracted_data.get('document_type')}")
print(f"extracted_fields: {extracted_data.get('extracted_fields')}")
print(f"confidence: {extracted_data.get('confidence')}")
print(f"error: {extracted_data.get('error')}")

# Step 2: Auto-populate form (as done in main.py line 1990)
print("\nStep 2: auto_populate_form()")
print("-" * 80)
form_data = service.auto_populate_form(extracted_data)
print(f"form_data: {form_data}")

# Step 3: Calculate confidence (as done in main.py line 1996)
print("\nStep 3: Calculate confidence (API endpoint logic)")
print("-" * 80)
confidence = len(extracted_data.get('extracted_fields', {})) / len(service.data_extractors)
print(f"confidence calculation: {len(extracted_data.get('extracted_fields', {}))} / {len(service.data_extractors)} = {confidence:.2f}")

# Step 4: Build final result (as done in main.py line 1998)
print("\nStep 4: Build API response")
print("-" * 80)
result = {
    "document_type": extracted_data.get('document_type', 'unknown'),
    "document_classification": extracted_data.get('document_classification', 'unknown'),
    "extracted_fields": extracted_data.get('extracted_fields', {}),
    "form_data": form_data,
    "confidence": min(confidence, 1.0),
}

print(json.dumps(result, indent=2))

# Final diagnosis
print("\n" + "=" * 80)
if result['extracted_fields']:
    print("✅ FULL FLOW WORKS - Backend should return fields")
    print("\n⚠️  If your backend is still returning empty, the issue is:")
    print("   1. Backend not restarted properly")
    print("   2. Docker using old image")
    print("   3. Python module cache not cleared")
else:
    print("❌ FULL FLOW BROKEN - There's a code issue")

    # Detailed diagnosis
    print("\nDetailed diagnosis:")
    print(f"  - extracted_data keys: {list(extracted_data.keys())}")
    print(f"  - extracted_fields type: {type(extracted_data.get('extracted_fields'))}")
    print(f"  - extracted_fields value: {extracted_data.get('extracted_fields')}")

    if 'error' in extracted_data:
        print(f"\n❌ ERROR in extraction: {extracted_data['error']}")

print("=" * 80)
