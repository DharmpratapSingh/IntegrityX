"""
Test script to upload the example PDF document
"""

import requests
from pathlib import Path

API_BASE_URL = "http://localhost:8000"

def upload_pdf():
    """Upload the example PDF document"""
    
    print("=" * 60)
    print("IntegrityX - PDF Document Upload Demo")
    print("=" * 60)
    print()
    
    # Check if PDF exists
    pdf_path = Path("IntegrityX-clean/example_loan_document.pdf")
    if not pdf_path.exists():
        print(f"[ERROR] PDF file not found: {pdf_path}")
        print("   Run: python create_example_pdf.py first")
        return
    
    print(f"Found PDF: {pdf_path}")
    print(f"File size: {pdf_path.stat().st_size / 1024:.2f} KB")
    print()
    
    print("Uploading PDF document...")
    
    try:
        # Open and upload the PDF file
        with open(pdf_path, 'rb') as pdf_file:
            # ingest-packet expects 'files' as a list
            files = [
                ('files', ('example_loan_document.pdf', pdf_file, 'application/pdf'))
            ]
            
            # Add query parameters
            params = {
                'loan_id': 'LOAN-2024-PDF-001',
                'created_by': 'demo_user@integrityx.com'
            }
            
            # Use ingest-packet endpoint which accepts any file type
            response = requests.post(
                f"{API_BASE_URL}/api/ingest-packet",
                files=files,
                params=params,
                timeout=30
            )
        
        print(f"Response Status: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200 and result.get("ok"):
            data = result.get("data", {})
            print("[SUCCESS] PDF uploaded and sealed successfully!")
            print()
            print("Upload Results:")
            print(f"   Artifact ID: {data.get('artifact_id', 'N/A')}")
            print(f"   ETID: {data.get('etid', 'N/A')}")
            print(f"   Walacor TX ID: {data.get('walacor_tx_id', 'N/A')}")
            print(f"   Document Hash: {data.get('document_hash', 'N/A')[:32]}...")
            print()
            
            artifact_id = data.get('artifact_id') or data.get('etid')
            if artifact_id:
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
            print(f"Response: {result}")
            
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to backend server!")
        print(f"   Make sure the backend is running on {API_BASE_URL}")
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    upload_pdf()

