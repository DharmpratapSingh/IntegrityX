#!/usr/bin/env python3
"""
Test script to verify quantum-safe and maximum-security endpoints work correctly.
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_quantum_safe_endpoint():
    """Test the quantum-safe sealing endpoint."""
    print("\n" + "="*60)
    print("🔬 Testing Quantum-Safe Endpoint")
    print("="*60)
    
    test_data = {
        "loan_id": f"TEST_QUANTUM_{int(datetime.now().timestamp())}",
        "document_type": "loan_application",
        "loan_amount": 100000.0,
        "borrower": {
            "full_name": "Test Quantum User",
            "date_of_birth": "1990-01-01",
            "email": "test.quantum@example.com",
            "phone": "555-1234",
            "address": {
                "street": "123 Test St",
                "city": "Test City",
                "state": "CA",
                "zip_code": "12345",
                "country": "US"
            },
            "ssn_last4": "1234",
            "id_type": "drivers_license",
            "id_last4": "5678",
            "employment_status": "employed",
            "annual_income": 75000.0
        },
        "created_by": "test@example.com"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/loan-documents/seal-quantum-safe",
            json=test_data,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)[:500]}...")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                artifact_id = data.get("data", {}).get("artifact_id")
                print(f"✅ Quantum-Safe endpoint works! Artifact ID: {artifact_id}")
                
                # Check if security_level is set correctly
                # We'll need to fetch the artifact to verify
                return artifact_id
            else:
                print(f"❌ Endpoint returned error: {data.get('error', 'Unknown error')}")
                return None
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def test_maximum_security_endpoint():
    """Test the maximum-security sealing endpoint."""
    print("\n" + "="*60)
    print("🛡️ Testing Maximum Security Endpoint")
    print("="*60)
    
    test_data = {
        "loan_id": f"TEST_MAXIMUM_{int(datetime.now().timestamp())}",
        "document_type": "loan_application",
        "loan_amount": 100000.0,
        "borrower": {
            "full_name": "Test Maximum User",
            "date_of_birth": "1990-01-01",
            "email": "test.maximum@example.com",
            "phone": "555-5678",
            "address": {
                "street": "456 Test Ave",
                "city": "Test City",
                "state": "CA",
                "zip_code": "12345",
                "country": "US"
            },
            "ssn_last4": "5678",
            "id_type": "drivers_license",
            "id_last4": "9012",
            "employment_status": "employed",
            "annual_income": 80000.0
        },
        "created_by": "test@example.com"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/loan-documents/seal-maximum-security",
            json=test_data,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)[:500]}...")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                artifact_id = data.get("data", {}).get("artifact_id")
                print(f"✅ Maximum Security endpoint works! Artifact ID: {artifact_id}")
                return artifact_id
            else:
                print(f"❌ Endpoint returned error: {data.get('error', 'Unknown error')}")
                return None
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def verify_security_level(artifact_id: str, expected_level: str):
    """Verify that the artifact has the correct security_level."""
    print(f"\n🔍 Verifying security_level for artifact: {artifact_id}")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/artifacts",
            params={"limit": 1000},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            artifacts = data.get("data", {}).get("artifacts", [])
            
            for artifact in artifacts:
                if artifact.get("id") == artifact_id:
                    security_level = artifact.get("security_level")
                    local_metadata = artifact.get("local_metadata", {})
                    metadata_security_level = local_metadata.get("security_level")
                    
                    print(f"  Top-level security_level: {security_level}")
                    print(f"  local_metadata.security_level: {metadata_security_level}")
                    
                    if security_level == expected_level or metadata_security_level == expected_level:
                        print(f"✅ Security level verified: {expected_level}")
                        return True
                    else:
                        print(f"❌ Security level mismatch! Expected: {expected_level}, Got: {security_level}/{metadata_security_level}")
                        return False
            
            print(f"❌ Artifact {artifact_id} not found in response")
            return False
        else:
            print(f"❌ Failed to fetch artifacts: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception verifying security level: {e}")
        return False

def check_backend_health():
    """Check if backend is running."""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        return response.status_code in [200, 404]  # 404 is OK, means server is running
    except:
        return False

if __name__ == "__main__":
    print("="*60)
    print("Security Endpoints Test Suite")
    print("="*60)
    
    # Check backend health
    if not check_backend_health():
        print("❌ Backend is not running! Please start the backend first.")
        sys.exit(1)
    
    print("✅ Backend is running")
    
    # Test quantum-safe endpoint
    quantum_artifact_id = test_quantum_safe_endpoint()
    if quantum_artifact_id:
        verify_security_level(quantum_artifact_id, "quantum_safe")
    
    # Test maximum-security endpoint
    maximum_artifact_id = test_maximum_security_endpoint()
    if maximum_artifact_id:
        verify_security_level(maximum_artifact_id, "maximum")
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    if quantum_artifact_id:
        print("✅ Quantum-Safe endpoint: WORKING")
    else:
        print("❌ Quantum-Safe endpoint: FAILED")
    
    if maximum_artifact_id:
        print("✅ Maximum Security endpoint: WORKING")
    else:
        print("❌ Maximum Security endpoint: FAILED")


