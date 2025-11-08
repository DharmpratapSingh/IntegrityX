#!/usr/bin/env python3
"""
Test Upload Feature - IntegrityX Document Upload Demo

This script demonstrates the complete document upload workflow:
1. Create a sample document
2. Upload to the backend API
3. Seal in blockchain
4. Verify the document
5. Retrieve and display results
"""

import requests
import json
import hashlib
import os
from datetime import datetime
from pathlib import Path

# API Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def calculate_sha256(content):
    """Calculate SHA-256 hash of content."""
    if isinstance(content, str):
        content = content.encode('utf-8')
    return hashlib.sha256(content).hexdigest()

def test_health_check():
    """Test if the backend is healthy."""
    print_section("1. HEALTH CHECK")
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy!")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print(f"   Make sure backend is running on {BASE_URL}")
        return False

def create_sample_document():
    """Create a sample loan document."""
    print_section("2. CREATE SAMPLE DOCUMENT")
    
    sample_document = {
        "loan_id": f"LOAN_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "document_type": "Loan Application",
        "loan_amount": 500000,
        "borrower": {
            "full_name": "John Doe",
            "date_of_birth": "1985-06-15",
            "email": "john.doe@example.com",
            "phone": "+1-555-123-4567",
            "address": {
                "street": "123 Main Street",
                "city": "Arlington",
                "state": "VA",
                "zip_code": "22201",
                "country": "United States"
            },
            "ssn_last4": "1234",
            "id_type": "Driver's License",
            "id_last4": "5678",
            "employment_status": "Employed",
            "employer_name": "Tech Corp Inc",
            "annual_income": 120000,
            "credit_score": 750
        },
        "loan_details": {
            "loan_type": "Conventional Mortgage",
            "property_address": "456 Oak Avenue, McLean, VA 22102",
            "property_value": 750000,
            "down_payment": 150000,
            "loan_term_years": 30,
            "interest_rate": 6.5,
            "monthly_payment": 2528
        },
        "additional_notes": "First-time homebuyer with excellent credit",
        "created_by": "test_user",
        "created_at": datetime.now().isoformat()
    }
    
    print("📄 Sample Document Created:")
    print(f"   Loan ID: {sample_document['loan_id']}")
    print(f"   Document Type: {sample_document['document_type']}")
    print(f"   Loan Amount: ${sample_document['loan_amount']:,}")
    print(f"   Borrower: {sample_document['borrower']['full_name']}")
    print(f"   Property Value: ${sample_document['loan_details']['property_value']:,}")
    
    # Calculate hash of the document
    doc_json = json.dumps(sample_document, sort_keys=True, separators=(',', ':'))
    doc_hash = calculate_sha256(doc_json)
    print(f"   Document Hash: {doc_hash[:16]}...{doc_hash[-16:]}")
    
    return sample_document, doc_hash

def test_seal_loan_document(sample_document):
    """Test the seal loan document endpoint."""
    print_section("3. SEAL DOCUMENT IN BLOCKCHAIN")
    
    # Prepare the request payload
    payload = {
        "loan_id": sample_document["loan_id"],
        "document_type": sample_document["document_type"],
        "loan_amount": sample_document["loan_amount"],
        "additional_notes": sample_document["additional_notes"],
        "created_by": sample_document["created_by"],
        "borrower": sample_document["borrower"]
    }
    
    print("📤 Sending seal request to backend...")
    print(f"   Endpoint: {API_URL}/loan-documents/seal")
    
    try:
        response = requests.post(
            f"{API_URL}/loan-documents/seal",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Document sealed successfully!")
            print(f"\n📊 Seal Results:")
            print(f"   Artifact ID: {result.get('artifact_id', 'N/A')}")
            print(f"   Walacor TX ID: {result.get('walacor_tx_id', 'N/A')[:50]}...")
            print(f"   Document Hash: {result.get('document_hash', 'N/A')[:16]}...{result.get('document_hash', 'N/A')[-16:]}")
            print(f"   Sealed At: {result.get('sealed_timestamp', 'N/A')}")
            
            if 'blockchain_proof' in result:
                proof = result['blockchain_proof']
                print(f"\n🔐 Blockchain Proof:")
                print(f"   Transaction ID: {proof.get('transaction_id', 'N/A')[:50]}...")
                print(f"   ETID: {proof.get('etid', 'N/A')}")
                print(f"   Blockchain Network: {proof.get('blockchain_network', 'N/A')}")
                print(f"   Integrity Verified: {proof.get('integrity_verified', 'N/A')}")
                print(f"   Immutability: {proof.get('immutability_established', 'N/A')}")
            
            return result
        else:
            print(f"❌ Seal failed with status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error sealing document: {e}")
        return None

def test_verify_document(loan_id):
    """Test document verification."""
    print_section("4. VERIFY DOCUMENT")
    
    print(f"🔍 Verifying loan document: {loan_id}")
    
    try:
        response = requests.get(
            f"{API_URL}/verify/{loan_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Verification successful!")
            print(f"\n📊 Verification Results:")
            print(f"   Document Found: {result.get('found', False)}")
            print(f"   Integrity Valid: {result.get('integrity_valid', False)}")
            print(f"   Blockchain Verified: {result.get('blockchain_verified', False)}")
            
            if 'document' in result:
                doc = result['document']
                print(f"\n📄 Document Details:")
                print(f"   Loan ID: {doc.get('loan_id', 'N/A')}")
                print(f"   Document Type: {doc.get('artifact_type', 'N/A')}")
                print(f"   Created At: {doc.get('created_at', 'N/A')}")
                print(f"   Created By: {doc.get('created_by', 'N/A')}")
            
            return result
        else:
            print(f"❌ Verification failed with status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error verifying document: {e}")
        return None

def test_get_documents():
    """Test retrieving all documents."""
    print_section("5. RETRIEVE ALL DOCUMENTS")
    
    print("📋 Fetching all documents from database...")
    
    try:
        response = requests.get(
            f"{API_URL}/documents",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            documents = result.get('documents', [])
            print(f"✅ Retrieved {len(documents)} document(s)")
            
            if documents:
                print(f"\n📄 Recent Documents:")
                for i, doc in enumerate(documents[:5], 1):  # Show first 5
                    print(f"\n   {i}. Loan ID: {doc.get('loan_id', 'N/A')}")
                    print(f"      Type: {doc.get('artifact_type', 'N/A')}")
                    print(f"      Hash: {doc.get('payload_sha256', 'N/A')[:16]}...")
                    print(f"      Created: {doc.get('created_at', 'N/A')}")
            else:
                print("   No documents found in database")
            
            return result
        else:
            print(f"❌ Failed to retrieve documents: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error retrieving documents: {e}")
        return None

def test_analytics():
    """Test analytics endpoint."""
    print_section("6. ANALYTICS DASHBOARD")
    
    print("📊 Fetching analytics data...")
    
    try:
        response = requests.get(
            f"{API_URL}/analytics/dashboard",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analytics retrieved successfully!")
            
            if 'summary' in result:
                summary = result['summary']
                print(f"\n📈 Summary:")
                print(f"   Total Documents: {summary.get('total_documents', 0)}")
                print(f"   Total Loan Value: ${summary.get('total_loan_value', 0):,.2f}")
                print(f"   Avg Loan Amount: ${summary.get('avg_loan_amount', 0):,.2f}")
                print(f"   Documents This Month: {summary.get('documents_this_month', 0)}")
            
            return result
        else:
            print(f"⚠️ Analytics not available: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"⚠️ Analytics error: {e}")
        return None

def main():
    """Main test function."""
    print("\n" + "="*70)
    print("  🚀 INTEGRITYX - DOCUMENT UPLOAD FEATURE TEST")
    print("="*70)
    print("\nThis test will demonstrate the complete document workflow:")
    print("  1. Health check")
    print("  2. Create sample document")
    print("  3. Seal in blockchain")
    print("  4. Verify document")
    print("  5. Retrieve all documents")
    print("  6. View analytics")
    
    # Step 1: Health check
    if not test_health_check():
        print("\n❌ Backend is not running. Please start the backend first:")
        print("   cd backend")
        print("   D:/IntegrityX/.venv/Scripts/uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    # Step 2: Create sample document
    sample_document, doc_hash = create_sample_document()
    
    # Step 3: Seal document
    seal_result = test_seal_loan_document(sample_document)
    if not seal_result:
        print("\n❌ Document sealing failed. Check backend logs for details.")
        return
    
    # Step 4: Verify document
    loan_id = sample_document["loan_id"]
    verify_result = test_verify_document(loan_id)
    
    # Step 5: Get all documents
    test_get_documents()
    
    # Step 6: Analytics
    test_analytics()
    
    # Summary
    print_section("✅ TEST COMPLETE")
    print("🎉 All tests completed successfully!")
    print(f"\n📝 Summary:")
    print(f"   Loan ID: {loan_id}")
    print(f"   Document Hash: {doc_hash[:16]}...{doc_hash[-16:]}")
    print(f"   Artifact ID: {seal_result.get('artifact_id', 'N/A')}")
    print(f"   Walacor TX ID: {seal_result.get('walacor_tx_id', 'N/A')[:50]}...")
    
    print(f"\n🌐 You can also test via the frontend:")
    print(f"   http://localhost:3000/upload")
    print(f"\n📊 View on dashboard:")
    print(f"   http://localhost:3000/integrated-dashboard")
    print(f"\n🔍 Verify document:")
    print(f"   http://localhost:3000/documents")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
