#!/usr/bin/env python3
"""
Test script to verify the quantum-safe seal endpoint configuration.
"""

import requests
import json
import time

def test_quantum_safe_endpoint():
    """Test the quantum-safe seal endpoint."""
    print("🔬 TESTING QUANTUM-SAFE SEAL ENDPOINT")
    print("=" * 50)
    
    # Test data for quantum-safe sealing
    test_document = {
        "loan_id": f"QUANTUM_TEST_{int(time.time())}",
        "document_type": "quantum_safe_test",
        "loan_amount": 500000.00,
        "additional_notes": "Quantum-safe cryptography test document",
        "created_by": "quantum_test@integrityx.com",
        "borrower": {
            "full_name": "Dr. Quantum Test",
            "date_of_birth": "1980-01-01",
            "email": "quantum.test@email.com",
            "phone": "555-QUANTUM",
            "address": {
                "street": "123 Quantum Street",
                "city": "Quantum City",
                "state": "QC",
                "zip_code": "12345",
                "country": "United States"
            },
            "ssn_last4": "1234",
            "id_type": "SSN",
            "id_last4": "1234",
            "employment_status": "employed",
            "annual_income": 200000.00,
            "co_borrower_name": None
        }
    }
    
    try:
        print("📡 Testing quantum-safe seal endpoint...")
        response = requests.post(
            "http://localhost:8000/api/loan-documents/seal-quantum-safe",
            json=test_document,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                print("✅ Quantum-safe seal endpoint working!")
                
                # Check quantum-safe features
                quantum_data = data.get("data", {})
                quantum_seal = quantum_data.get("quantum_safe_seal", {})
                
                print(f"\n🔬 Quantum-Safe Features:")
                print(f"   Security Level: {quantum_seal.get('security_level', 'N/A')}")
                print(f"   Quantum Safe: {quantum_seal.get('quantum_safe', 'N/A')}")
                print(f"   Algorithms Used: {quantum_seal.get('algorithms_used', [])}")
                
                # Check quantum-resistant hashes
                hashes = quantum_seal.get("quantum_resistant_hashes", {})
                print(f"\n🔐 Quantum-Resistant Hashes:")
                for algo, hash_value in hashes.items():
                    if hash_value:
                        print(f"   {algo.upper()}: {hash_value[:32]}...")
                    else:
                        print(f"   {algo.upper()}: Not generated")
                
                # Check quantum-safe signatures
                signatures = quantum_seal.get("quantum_safe_signatures", {})
                print(f"\n✍️ Quantum-Safe Signatures:")
                for sig_type, sig_data in signatures.items():
                    print(f"   {sig_type.upper()}: {sig_data}")
                
                return True
            else:
                print(f"❌ API returned error: {data}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing quantum-safe endpoint: {e}")
        return False

def test_quantum_safe_dependencies():
    """Test if quantum-safe dependencies are available."""
    print("\n🔧 TESTING QUANTUM-SAFE DEPENDENCIES")
    print("=" * 50)
    
    try:
        # Test quantum-safe hashing
        from src.quantum_safe_security import quantum_safe_hashing
        print("✅ Quantum-safe hashing available")
        
        # Test quantum-safe signatures
        from src.quantum_safe_security import quantum_safe_signatures
        print("✅ Quantum-safe signatures available")
        
        # Test hybrid security service
        from src.quantum_safe_security import HybridSecurityService
        service = HybridSecurityService()
        print("✅ HybridSecurityService initialized")
        
        # Test quantum-safe algorithms
        test_data = "quantum-safe test data"
        
        # Test SHAKE256
        shake256_hash = quantum_safe_hashing.shake256_hash(test_data)
        print(f"✅ SHAKE256: {shake256_hash[:32]}...")
        
        # Test BLAKE3
        blake3_hash = quantum_safe_hashing.blake3_hash(test_data)
        print(f"✅ BLAKE3: {blake3_hash[:32]}...")
        
        # Test SHA3-512
        sha3_512_hash = quantum_safe_hashing.sha3_512_hash(test_data)
        print(f"✅ SHA3-512: {sha3_512_hash[:32]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Quantum-safe dependencies error: {e}")
        return False

def test_encryption_service():
    """Test if encryption service is available."""
    print("\n🔐 TESTING ENCRYPTION SERVICE")
    print("=" * 50)
    
    try:
        from src.encryption_service import get_encryption_service
        encryption_service = get_encryption_service()
        print("✅ Encryption service available")
        
        # Test borrower data encryption
        test_borrower = {
            "full_name": "Test Borrower",
            "ssn_last4": "1234",
            "email": "test@example.com"
        }
        
        encrypted_data = encryption_service.encrypt_borrower_data(test_borrower)
        print(f"✅ Borrower data encryption working")
        print(f"   Encrypted data length: {len(encrypted_data)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Encryption service error: {e}")
        return False

if __name__ == "__main__":
    print("🔬 QUANTUM-SAFE ENDPOINT CONFIGURATION TEST")
    print("=" * 60)
    print("Testing quantum-safe seal endpoint and dependencies")
    print("=" * 60)
    
    # Test dependencies
    deps_success = test_quantum_safe_dependencies()
    encryption_success = test_encryption_service()
    
    # Test endpoint
    endpoint_success = test_quantum_safe_endpoint()
    
    print("\n" + "=" * 60)
    print("📊 QUANTUM-SAFE CONFIGURATION SUMMARY")
    print("=" * 60)
    
    if deps_success and encryption_success and endpoint_success:
        print("✅ Quantum-safe endpoint fully configured and working!")
        print("🎉 All quantum-safe features operational!")
    else:
        print("❌ Quantum-safe endpoint needs configuration")
        if not deps_success:
            print("   • Quantum-safe dependencies need fixing")
        if not encryption_success:
            print("   • Encryption service needs configuration")
        if not endpoint_success:
            print("   • Quantum-safe endpoint needs debugging")
    
    print(f"\n🔧 Configuration Status:")
    print(f"   Dependencies: {'✅' if deps_success else '❌'}")
    print(f"   Encryption: {'✅' if encryption_success else '❌'}")
    print(f"   Endpoint: {'✅' if endpoint_success else '❌'}")






