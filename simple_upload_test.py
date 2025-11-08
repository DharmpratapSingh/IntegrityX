#!/usr/bin/env python3
"""
Simple Upload Test - IntegrityX Document Upload Demo

This demonstrates uploading a loan document and sealing it in the blockchain.
"""

import requests
import json
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000/api"

def main():
    print("\n" + "="*70)
    print("  🚀 INTEGRITYX - SIMPLE UPLOAD TEST")
    print("="*70 + "\n")
    
    # Step 1: Create sample loan document
    print("📄 Creating sample loan document...")
    
    loan_document = {
        "loan_id": f"LOAN_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "document_type": "Loan Application",
        "loan_amount": 500000,
        "additional_notes": "First-time homebuyer with excellent credit",
        "created_by": "test_user",
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
        }
    }
    
    print(f"   Loan ID: {loan_document['loan_id']}")
    print(f"   Borrower: {loan_document['borrower']['full_name']}")
    print(f"   Amount: ${loan_document['loan_amount']:,}")
    
    # Step 2: Upload and seal the document
    print(f"\n📤 Uploading to blockchain...")
    print(f"   Endpoint: {API_URL}/loan-documents/seal\n")
    
    try:
        response = requests.post(
            f"{API_URL}/loan-documents/seal",
            json=loan_document,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"\n Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*70)
            print("  ✅ SUCCESS - Document Sealed in Blockchain!")
            print("="*70)
            
            if result.get('ok'):
                data = result.get('data', {})
                print(f"\n📊 Seal Results:")
                print(f"   Artifact ID: {data.get('artifact_id', 'N/A')}")
                print(f"   Walacor TX ID: {data.get('walacor_tx_id', 'N/A')[:60]}...")
                print(f"   Document Hash: {data.get('document_hash', 'N/A')}")
                print(f"   Sealed At: {data.get('sealed_timestamp', 'N/A')}")
                
                if 'blockchain_proof' in data:
                    proof = data['blockchain_proof']
                    print(f"\n🔐 Blockchain Proof:")
                    print(f"   Transaction ID: {proof.get('transaction_id', 'N/A')[:60]}...")
                    print(f"   ETID: {proof.get('etid', 'N/A')}")
                    print(f"   Network: {proof.get('blockchain_network', 'N/A')}")
                    print(f"   Integrity Verified: {proof.get('integrity_verified', 'N/A')}")
                
                # Show how to access it
                print(f"\n🌐 Access Your Document:")
                print(f"   Frontend Upload: http://localhost:3000/upload")
                print(f"   Dashboard: http://localhost:3000/integrated-dashboard")
                print(f"   Documents: http://localhost:3000/documents")
            
        else:
            print(f"\n❌ Upload failed!")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure the backend is running:")
        print("   D:/IntegrityX/.venv/Scripts/uvicorn backend.main:app --reload --port 8000")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
