"""
Simple test script to upload an example document using the ingest-json endpoint
"""

import requests
import json
from pathlib import Path

API_BASE_URL = "http://localhost:8000"

def upload_simple_example():
    """Upload example document using the simpler ingest-json endpoint"""
    
    print("=" * 60)
    print("IntegrityX - Simple Document Upload Demo")
    print("=" * 60)
    print()
    
    # Load example document
    example_file = Path("IntegrityX-clean/example_loan_document.json")
    if not example_file.exists():
        print(f"[ERROR] Example file not found: {example_file}")
        return
    
    print(f"Loading example document: {example_file}")
    with open(example_file, 'r', encoding='utf-8') as f:
        loan_data = json.load(f)
    
    print(f"Loaded document: {loan_data['loanId']}")
    print()
    
    # Use the ingest-json endpoint which accepts file uploads
    print("Uploading document via /api/ingest-json endpoint...")
    print(f"   Loan ID: {loan_data['loanId']}")
    print(f"   Borrower: {loan_data['borrowerName']}")
    print(f"   Amount: ${loan_data['amount']:,.2f}")
    print()
    
    try:
        # Create a file-like object from the JSON data
        import io
        json_bytes = json.dumps(loan_data).encode('utf-8')
        json_file = io.BytesIO(json_bytes)
        
        # Prepare multipart form data
        files = {
            'file': ('loan_document.json', json_file, 'application/json')
        }
        
        # Add query parameters
        params = {
            'loan_id': loan_data['loanId'],
            'artifact_type': 'json',
            'created_by': 'demo_user@integrityx.com'
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/ingest-json",
            files=files,
            params=params,
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200 and result.get("ok"):
            data = result.get("data", {})
            print("[SUCCESS] Document uploaded and sealed successfully!")
            print()
            print("Upload Results:")
            print(f"   ETID: {data.get('etid', 'N/A')}")
            print(f"   Artifact ID: {data.get('artifact_id', 'N/A')}")
            print(f"   Walacor TX ID: {data.get('walacor_tx_id', 'N/A')}")
            print(f"   Document Hash: {data.get('document_hash', 'N/A')[:32]}...")
            print()
            
            # Get artifact details
            artifact_id = data.get('artifact_id') or data.get('etid')
            if artifact_id:
                print("Fetching artifact details...")
                verify_response = requests.get(
                    f"{API_BASE_URL}/api/artifacts/{artifact_id}",
                    timeout=10
                )
                
                if verify_response.status_code == 200:
                    verify_result = verify_response.json()
                    if verify_result.get("ok"):
                        verify_data = verify_result.get("data", {})
                        print("[SUCCESS] Artifact retrieved!")
                        print(f"   Status: {verify_data.get('status', 'N/A')}")
                        print(f"   Created At: {verify_data.get('created_at', 'N/A')}")
                        print()
                
                print("=" * 60)
                print("[SUCCESS] Demo completed successfully!")
                print("=" * 60)
                print()
                print("View in frontend:")
                print(f"   http://localhost:3000/documents/{artifact_id}")
                print()
                print("API Endpoints:")
                print(f"   Get artifact: http://localhost:8000/api/artifacts/{artifact_id}")
                print(f"   Verify: http://localhost:8000/api/verify/{artifact_id}")
                print()
        else:
            print(f"[ERROR] Upload failed")
            print(f"Response: {json.dumps(result, indent=2)}")
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to backend server!")
        print(f"   Make sure the backend is running on {API_BASE_URL}")
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    upload_simple_example()

