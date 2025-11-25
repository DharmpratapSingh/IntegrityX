#!/usr/bin/env python3
"""
Test script for upload functionality
Tests the upload endpoint with proper borrower data including annual_income_range fix
"""

import requests
import json
import time
from datetime import datetime

API_BASE = "http://localhost:8000"

def test_upload_with_kyc_data():
    """Test upload with complete KYC and loan information"""
    print("=" * 80)
    print("TESTING UPLOAD FUNCTIONALITY")
    print("=" * 80)
    print()
    
    # Create test loan data
    loan_data = {
        "loan_id": f"TEST_LOAN_{int(time.time())}",
        "document_type": "loan_application",
        "loan_amount": 250000,
        "loan_term": 360,
        "interest_rate": 4.5,
        "property_address": "123 Test St, Test City, CA 12345",
        "borrower_name": "John Test Doe",
        "additional_notes": "Test upload from automated test script",
        "created_by": "test-script"
    }
    
    # Create borrower info with annual_income_range as string (the fix)
    borrower_info = {
        "full_name": "John Test Doe",
        "date_of_birth": "1990-01-15",
        "email": "john.test@example.com",
        "phone": "+1-555-123-4567",
        "address": {
            "street": "123 Test Street",
            "city": "Test City",
            "state": "CA",
            "zip_code": "12345",
            "country": "US"
        },
        "ssn_last4": "1234",
        "id_type": "drivers_license",
        "id_last4": "5678",
        "employment_status": "employed",
        "annual_income": 75000,  # This will be converted to range string by backend
        "co_borrower_name": ""
    }
    
    # Create request payload
    payload = {
        "loan_id": loan_data["loan_id"],
        "document_type": loan_data["document_type"],
        "loan_amount": loan_data["loan_amount"],
        "loan_term": loan_data["loan_term"],
        "interest_rate": loan_data["interest_rate"],
        "property_address": loan_data["property_address"],
        "borrower_name": loan_data["borrower_name"],
        "additional_notes": loan_data["additional_notes"],
        "created_by": loan_data["created_by"],
        "borrower": borrower_info
    }
    
    print("📤 Test 1: Upload with complete data")
    print(f"   Loan ID: {loan_data['loan_id']}")
    print(f"   Borrower: {borrower_info['full_name']}")
    print(f"   Annual Income: ${borrower_info['annual_income']}")
    print()
    
    try:
        # Create a simple test file
        test_file_content = json.dumps({
            "loan_id": loan_data["loan_id"],
            "test": True,
            "timestamp": datetime.now().isoformat()
        })
        
        files = {
            'files': ('test_upload.json', test_file_content.encode(), 'application/json')
        }
        
        # Make the request
        response = requests.post(
            f"{API_BASE}/api/loan-documents/seal",
            data=payload,
            files=files,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("ok"):
                data = result.get("data", {})
                print(f"   ✅ SUCCESS!")
                print(f"   Artifact ID: {data.get('artifact_id', 'N/A')}")
                print(f"   Transaction ID: {data.get('walacor_tx_id', 'N/A')}")
                print(f"   Sealed At: {data.get('sealed_at', 'N/A')}")
                return True
            else:
                print(f"   ❌ FAILED: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"   ❌ FAILED: HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', error_data.get('message', 'Unknown error'))}")
            except:
                print(f"   Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ REQUEST ERROR: {str(e)}")
        return False
    except Exception as e:
        print(f"   ❌ UNEXPECTED ERROR: {str(e)}")
        return False

def test_backend_health():
    """Test if backend is healthy"""
    print("🏥 Checking backend health...")
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is healthy")
            return True
        else:
            print(f"   ⚠️  Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend health check failed: {e}")
        return False

def main():
    """Run all tests"""
    print()
    
    # Check backend health first
    if not test_backend_health():
        print("\n⚠️  Backend is not available. Please start it before running tests.")
        return
    
    print()
    
    # Run upload test
    success = test_upload_with_kyc_data()
    
    print()
    print("=" * 80)
    if success:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ TESTS FAILED - Check errors above")
    print("=" * 80)
    print()

if __name__ == "__main__":
    main()


