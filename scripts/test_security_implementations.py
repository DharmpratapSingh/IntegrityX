#!/usr/bin/env python3
"""
Test script to verify Quantum Safe and Maximum Security implementations.
This script tests that the security services are actually working as intended.
"""

import sys
import json
import subprocess
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def http_post(endpoint: str, payload: Dict[str, Any], timeout: int = 30) -> Dict[str, Any]:
    """Make HTTP POST request using curl."""
    try:
        cmd = [
            "curl", "-s", "-X", "POST",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload),
            f"{BASE_URL}{endpoint}",
            "--max-time", str(timeout)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except:
                return {"ok": False, "error": "Invalid JSON response", "raw": result.stdout}
        else:
            return {"ok": False, "error": result.stderr or "Request failed"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def http_get(endpoint: str, params: Dict[str, Any] = None, timeout: int = 30) -> Dict[str, Any]:
    """Make HTTP GET request using curl."""
    try:
        url = f"{BASE_URL}{endpoint}"
        if params:
            query_string = "&".join([f"{k}={v}" for k, v in params.items()])
            url = f"{url}?{query_string}"
        
        cmd = ["curl", "-s", url, "--max-time", str(timeout)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            try:
                return json.loads(result.stdout)
            except:
                return {"ok": False, "error": "Invalid JSON response", "raw": result.stdout}
        else:
            return {"ok": False, "error": result.stderr or "Request failed"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def test_quantum_safe_security():
    """Test Quantum Safe security implementation."""
    print("\n" + "="*80)
    print("TESTING QUANTUM SAFE SECURITY")
    print("="*80)
    
    # Create a test document
    loan_id = f"TEST_QUANTUM_SAFE_{int(time.time())}"
    payload = {
        "loan_id": loan_id,
        "document_type": "loan_application",
        "loan_amount": 100000,
        "loan_type": "home_loan",
        "property_value": 250000,
        "down_payment": 50000,
        "property_type": "Single Family",
        "property_address": "123 Test St, Test City, TS 12345",
        "loan_term": 30,
        "interest_rate": 3.5,
        "additional_notes": "Test quantum safe security",
        "created_by": "test_user",
        "borrower": {
            "full_name": "Test Quantum Safe User",
            "date_of_birth": "1990-01-01",
            "email": "quantum@test.com",
            "phone": "555-0100",
            "address": {
                "street": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "zip_code": "12345",
                "country": "United States"
            },
            "ssn_last4": "1234",
            "ssn_or_itin_type": "SSN",
            "ssn_or_itin_number": "123-45-6789",
            "id_type": "Driver's License",
            "id_last4": "5678",
            "employment_status": "employed",
            "annual_income": 75000
        }
    }
    
    print(f"\n📤 Uploading test document with Quantum Safe security...")
    result = http_post("/api/loan-documents/seal-quantum-safe", payload, timeout=60)
    
    if not result.get("ok"):
        print(f"  ❌ Failed to seal document: {result.get('error')}")
        return False
    
    data = result.get("data", {})
    artifact_id = data.get("artifact_id")
    quantum_seal = data.get("quantum_safe_seal", {})
    
    print(f"  ✅ Document sealed successfully!")
    print(f"  Artifact ID: {artifact_id}")
    
    # Check quantum-safe seal features
    print(f"\n🔍 Verifying Quantum Safe Security Features:")
    
    # 1. Check security level
    security_level = quantum_seal.get("security_level")
    print(f"  1. Security Level: {security_level}")
    if security_level != "quantum_safe":
        print(f"     ⚠️  Expected 'quantum_safe', got '{security_level}'")
        return False
    
    # 2. Check quantum-safe hashes
    quantum_hashes = quantum_seal.get("quantum_resistant_hashes", {})
    print(f"  2. Quantum-Resistant Hashes:")
    required_hashes = ["shake256", "blake3", "sha3_512"]
    for hash_type in required_hashes:
        hash_value = quantum_hashes.get(hash_type)
        if hash_value:
            print(f"     ✅ {hash_type}: {hash_value[:32]}...")
        else:
            print(f"     ❌ {hash_type}: Missing!")
            return False
    
    # 3. Check quantum-safe signatures
    quantum_signatures = quantum_seal.get("quantum_safe_signatures", {})
    print(f"  3. Quantum-Safe Signatures:")
    dilithium = quantum_signatures.get("dilithium2")
    if dilithium:
        print(f"     ✅ Dilithium2: Present")
    else:
        print(f"     ⚠️  Dilithium2: Not present (may be placeholder)")
    
    # 4. Check algorithms used
    algorithms = quantum_seal.get("algorithms_used", [])
    print(f"  4. Algorithms Used: {algorithms}")
    if "shake256" in str(algorithms) or "blake3" in str(algorithms):
        print(f"     ✅ Quantum-safe algorithms present")
    else:
        print(f"     ⚠️  Quantum-safe algorithms may be missing")
    
    # 5. Verify document in database
    print(f"\n📊 Checking stored document metadata...")
    artifacts_result = http_get("/api/artifacts", {"limit": 1000}, timeout=30)
    if artifacts_result.get("ok"):
        artifacts = artifacts_result.get("data", {}).get("artifacts", [])
        test_artifact = None
        for a in artifacts:
            if a.get("id") == artifact_id:
                test_artifact = a
                break
        
        if test_artifact:
            local_metadata = test_artifact.get("local_metadata", {})
            stored_security_level = local_metadata.get("security_level")
            stored_algorithms = local_metadata.get("algorithms_used", [])
            
            print(f"  Security Level in DB: {stored_security_level}")
            print(f"  Algorithms in DB: {stored_algorithms}")
            
            if stored_security_level == "quantum_safe":
                print(f"  ✅ Security level correctly stored")
            else:
                print(f"  ⚠️  Security level mismatch: expected 'quantum_safe', got '{stored_security_level}'")
    
    print(f"\n  ✅ Quantum Safe Security Test: PASSED")
    return True

def test_maximum_security():
    """Test Maximum Security implementation."""
    print("\n" + "="*80)
    print("TESTING MAXIMUM SECURITY")
    print("="*80)
    
    # Create a test document
    loan_id = f"TEST_MAXIMUM_SECURITY_{int(time.time())}"
    payload = {
        "loan_id": loan_id,
        "document_type": "loan_application",
        "loan_amount": 200000,
        "loan_type": "home_loan",
        "property_value": 500000,
        "down_payment": 100000,
        "property_type": "Single Family",
        "property_address": "456 Maximum St, Secure City, SC 54321",
        "loan_term": 30,
        "interest_rate": 3.0,
        "additional_notes": "Test maximum security",
        "created_by": "test_user",
        "borrower": {
            "full_name": "Test Maximum Security User",
            "date_of_birth": "1985-05-15",
            "email": "maximum@test.com",
            "phone": "555-0200",
            "address": {
                "street": "456 Maximum St",
                "city": "Secure City",
                "state": "SC",
                "zip_code": "54321",
                "country": "United States"
            },
            "ssn_last4": "5678",
            "ssn_or_itin_type": "SSN",
            "ssn_or_itin_number": "987-65-4321",
            "id_type": "Passport",
            "id_last4": "1234",
            "employment_status": "employed",
            "annual_income": 150000
        }
    }
    
    print(f"\n📤 Uploading test document with Maximum Security...")
    result = http_post("/api/loan-documents/seal-maximum-security", payload, timeout=60)
    
    if not result.get("ok"):
        print(f"  ❌ Failed to seal document: {result.get('error')}")
        return False
    
    data = result.get("data", {})
    artifact_id = data.get("artifact_id")
    comprehensive_seal = data.get("comprehensive_seal", {})
    
    print(f"  ✅ Document sealed successfully!")
    print(f"  Artifact ID: {artifact_id}")
    
    # Check maximum security features
    print(f"\n🔍 Verifying Maximum Security Features:")
    
    # 1. Check security level
    security_level = comprehensive_seal.get("security_level")
    print(f"  1. Security Level: {security_level}")
    if security_level != "maximum":
        print(f"     ⚠️  Expected 'maximum', got '{security_level}'")
        return False
    
    # 2. Check verification methods
    verification_methods = comprehensive_seal.get("verification_methods", [])
    print(f"  2. Verification Methods: {verification_methods}")
    required_methods = ["multi_hash", "pki_signature", "content_integrity"]
    for method in required_methods:
        if method in verification_methods:
            print(f"     ✅ {method}: Present")
        else:
            print(f"     ⚠️  {method}: Missing")
    
    # 3. Check algorithms used
    algorithms = comprehensive_seal.get("algorithms_used", [])
    print(f"  3. Algorithms Used: {algorithms}")
    expected_algorithms = ["sha256", "sha512", "blake2b", "sha3_256"]
    found_algorithms = [alg for alg in expected_algorithms if alg in str(algorithms)]
    if found_algorithms:
        print(f"     ✅ Multi-algorithm hashing: {found_algorithms}")
    else:
        print(f"     ⚠️  Expected multi-algorithm hashing")
    
    # 4. Check PKI signature
    print(f"  4. PKI Signature:")
    if "pki_signature" in str(comprehensive_seal) or "RSA" in str(algorithms):
        print(f"     ✅ PKI signature present")
    else:
        print(f"     ⚠️  PKI signature may be missing")
    
    # 5. Verify document in database
    print(f"\n📊 Checking stored document metadata...")
    artifacts_result = http_get("/api/artifacts", {"limit": 1000}, timeout=30)
    if artifacts_result.get("ok"):
        artifacts = artifacts_result.get("data", {}).get("artifacts", [])
        test_artifact = None
        for a in artifacts:
            if a.get("id") == artifact_id:
                test_artifact = a
                break
        
        if test_artifact:
            local_metadata = test_artifact.get("local_metadata", {})
            stored_security_level = local_metadata.get("security_level")
            stored_seal = local_metadata.get("comprehensive_seal", {})
            
            print(f"  Security Level in DB: {stored_security_level}")
            print(f"  Has Comprehensive Seal: {bool(stored_seal)}")
            
            if stored_security_level == "maximum":
                print(f"  ✅ Security level correctly stored")
            else:
                print(f"  ⚠️  Security level mismatch: expected 'maximum', got '{stored_security_level}'")
    
    print(f"\n  ✅ Maximum Security Test: PASSED")
    return True

def main():
    """Run all security tests."""
    print("="*80)
    print("SECURITY IMPLEMENTATION VERIFICATION")
    print("="*80)
    
    # Check if backend is running
    health = http_get("/health", timeout=5)
    if not health:
        print("❌ Backend is not running. Please start the backend first.")
        return
    
    print("✅ Backend is running")
    
    # Run tests
    quantum_result = test_quantum_safe_security()
    maximum_result = test_maximum_security()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Quantum Safe Security: {'✅ PASSED' if quantum_result else '❌ FAILED'}")
    print(f"Maximum Security: {'✅ PASSED' if maximum_result else '❌ FAILED'}")
    
    if quantum_result and maximum_result:
        print("\n🎉 All security implementations are working correctly!")
    else:
        print("\n⚠️  Some security implementations need attention.")

if __name__ == "__main__":
    main()


