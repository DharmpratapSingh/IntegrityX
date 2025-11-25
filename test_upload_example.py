"""
Test script to upload an example loan document to IntegrityX
Demonstrates how the application works
"""

import requests
import json
import os
from pathlib import Path

# API Configuration
API_BASE_URL = "http://localhost:8000"

def upload_example_document():
    """Upload an example loan document to demonstrate the application"""
    
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print("=" * 60)
    print("IntegrityX - Example Document Upload Demo")
    print("=" * 60)
    print()
    
    # Load example document
    example_file = Path("IntegrityX-clean/example_loan_document.json")
    if not example_file.exists():
        print(f"❌ Example file not found: {example_file}")
        return
    
    print(f"Loading example document: {example_file}")
    with open(example_file, 'r', encoding='utf-8') as f:
        loan_data = json.load(f)
    
    print(f"Loaded document: {loan_data['loanId']}")
    print()
    
    # Prepare loan document data
    ssn = loan_data["borrowerInfo"]["ssn"]
    ssn_last4 = ssn.split("-")[-1] if "-" in ssn else ssn[-4:]
    
    loan_document_data = {
        "loan_id": loan_data["loanId"],
        "document_type": "loan_application",
        "loan_amount": float(loan_data["amount"]),
        "additional_notes": f"Example loan document for {loan_data['borrowerName']}",
        "borrower": {
            "full_name": loan_data["borrowerName"],
            "date_of_birth": loan_data["borrowerInfo"]["dateOfBirth"],
            "email": loan_data["borrowerInfo"]["email"],
            "phone": loan_data["borrowerInfo"]["phone"],
            "address": {
                "street": loan_data["borrowerInfo"]["address"]["street"],
                "city": loan_data["borrowerInfo"]["address"]["city"],
                "state": loan_data["borrowerInfo"]["address"]["state"],
                "zip_code": loan_data["borrowerInfo"]["address"]["zipCode"],
                "country": "United States"
            },
            "ssn_last4": ssn_last4,
            "id_type": "SSN",
            "id_last4": ssn_last4,
            "employment_status": loan_data["borrowerInfo"]["employment"]["status"],
            "annual_income": float(loan_data["borrowerInfo"]["employment"]["annualIncome"])
        },
        "created_by": "demo_user@integrityx.com"
    }
    
    print("Uploading document to IntegrityX...")
    print(f"   Loan ID: {loan_document_data['loan_id']}")
    print(f"   Borrower: {loan_document_data['borrower']['full_name']}")
    print(f"   Amount: ${loan_document_data['loan_amount']:,.2f}")
    print()
    
    try:
        # Upload the document
        response = requests.post(
            f"{API_BASE_URL}/api/loan-documents/seal",
            json=loan_document_data,
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        result = response.json()
        print(f"Response OK: {result.get('ok')}")
        if not result.get('ok'):
            print(f"Full Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            if result.get("ok"):
                data = result.get("data", {})
                print("[SUCCESS] Document uploaded and sealed successfully!")
                print()
                print("Upload Results:")
                print(f"   Artifact ID: {data.get('artifact_id', 'N/A')}")
                print(f"   Walacor TX ID: {data.get('walacor_tx_id', 'N/A')}")
                print(f"   Document Hash: {data.get('document_hash', 'N/A')[:32]}...")
                print(f"   Sealed At: {data.get('sealed_at', 'N/A')}")
                print()
                
                # Verify the document
                print("Verifying document integrity...")
                artifact_id = data.get('artifact_id')
                if artifact_id:
                    verify_response = requests.get(
                        f"{API_BASE_URL}/api/artifacts/{artifact_id}",
                        timeout=10
                    )
                    
                    if verify_response.status_code == 200:
                        verify_result = verify_response.json()
                        if verify_result.get("ok"):
                            verify_data = verify_result.get("data", {})
                            print("[SUCCESS] Document verified!")
                            print(f"   Status: {verify_data.get('status', 'N/A')}")
                            print(f"   Blockchain Sealed: {verify_data.get('blockchain_seal', 'N/A')}")
                            print()
                
                print("=" * 60)
                print("[SUCCESS] Demo completed successfully!")
                print("=" * 60)
                print()
                print("View in frontend:")
                print(f"   http://localhost:3000/documents/{artifact_id}")
                print()
                
            else:
                error = result.get("error") or {}
                print(f"[ERROR] Upload failed: {error.get('message', 'Unknown error') if error else 'Unknown error'}")
                if error and error.get("details"):
                    print(f"   Details: {error['details']}")
        else:
            print(f"[ERROR] HTTP Error {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Response: {response.text[:500]}")
                
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to backend server!")
        print(f"   Make sure the backend is running on {API_BASE_URL}")
        print("   Run: cd IntegrityX-clean/backend && python start_server.py")
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    upload_example_document()

