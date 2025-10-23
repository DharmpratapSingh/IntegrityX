"""
API Test Examples for IntegrityX

This file provides examples of how to use the IntegrityX API endpoints
for testing and integration purposes.
"""

import requests
import json
import base64
from datetime import datetime, timezone

class IntegrityXAPITester:
    """API tester for IntegrityX endpoints."""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.session = requests.Session()
    
    def test_document_upload(self):
        """Example: Upload a document."""
        print("\n📄 Example: Document Upload")
        print("-" * 40)
        
        document_data = {
            "loan_id": "LOAN_API_TEST_001",
            "borrower_name": "John Doe",
            "loan_amount": 250000,
            "interest_rate": 6.5,
            "loan_term": 360,
            "property_address": "123 Main St, Anytown, ST 12345",
            "credit_score": 750,
            "annual_income": 85000,
            "employment_status": "Employed",
            "document_type": "loan_application",
            "submission_date": datetime.now(timezone.utc).isoformat()
        }
        
        print("Request:")
        print(json.dumps(document_data, indent=2))
        
        try:
            response = self.session.post(
                f"{self.api_base}/artifacts",
                json=document_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\nResponse Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("Response:")
                print(json.dumps(result, indent=2))
                return result
            else:
                print(f"Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_ai_document_processing(self):
        """Example: AI document processing."""
        print("\n🤖 Example: AI Document Processing")
        print("-" * 40)
        
        # Create sample document
        sample_document = {
            "loanId": "LOAN_AI_API_TEST_001",
            "amount": 300000,
            "rate": 5.75,
            "term": 360,
            "borrower": {
                "name": "Jane Smith",
                "email": "jane.smith@example.com"
            },
            "application": "Loan Application",
            "borrower_information": "Jane Smith",
            "income_verification": "Verified",
            "credit_score": 780
        }
        
        # Encode document as base64
        document_json = json.dumps(sample_document)
        document_base64 = base64.b64encode(document_json.encode()).decode()
        
        request_data = {
            "filename": "test_loan_application.json",
            "content_type": "application/json",
            "file_content": document_base64
        }
        
        print("Request:")
        print(json.dumps({
            "filename": request_data["filename"],
            "content_type": request_data["content_type"],
            "file_content": f"[Base64 encoded, {len(document_base64)} characters]"
        }, indent=2))
        
        try:
            response = self.session.post(
                f"{self.api_base}/ai/analyze-document-json",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\nResponse Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("Response:")
                print(json.dumps(result, indent=2))
                return result
            else:
                print(f"Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_document_signing(self):
        """Example: Document signing."""
        print("\n✍️ Example: Document Signing")
        print("-" * 40)
        
        signing_request = {
            "document_id": "DOC_SIGNING_API_TEST_001",
            "document_name": "Test Loan Application",
            "signers": [
                {
                    "email": "borrower@example.com",
                    "name": "John Borrower",
                    "role": "signer",
                    "order": 1
                },
                {
                    "email": "co_borrower@example.com",
                    "name": "Jane Co-Borrower",
                    "role": "signer",
                    "order": 2
                }
            ],
            "signing_fields": [
                {
                    "field_type": "signature",
                    "page_number": 1,
                    "x_position": 100.0,
                    "y_position": 200.0,
                    "width": 150.0,
                    "height": 50.0,
                    "recipient_id": "1",
                    "required": True,
                    "tab_label": "Borrower Signature"
                },
                {
                    "field_type": "signature",
                    "page_number": 1,
                    "x_position": 100.0,
                    "y_position": 300.0,
                    "width": 150.0,
                    "height": 50.0,
                    "recipient_id": "2",
                    "required": True,
                    "tab_label": "Co-Borrower Signature"
                }
            ],
            "template_type": "loan_application",
            "provider": "docusign"
        }
        
        print("Request:")
        print(json.dumps(signing_request, indent=2))
        
        try:
            response = self.session.post(
                f"{self.api_base}/signing/create-envelope",
                json=signing_request,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\nResponse Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("Response:")
                print(json.dumps(result, indent=2))
                return result
            else:
                print(f"Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_analytics(self):
        """Example: Analytics endpoints."""
        print("\n📊 Example: Analytics")
        print("-" * 40)
        
        endpoints = [
            ("/api/analytics/system-metrics", "System Metrics"),
            ("/api/analytics/bulk-operations", "Bulk Operations Analytics"),
            ("/api/signing/providers", "Signing Providers"),
            ("/api/signing/templates", "Signing Templates")
        ]
        
        results = {}
        
        for endpoint, name in endpoints:
            print(f"\n{name}:")
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                print(f"  Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"  Response: {json.dumps(result, indent=2)[:200]}...")
                    results[name] = result
                else:
                    print(f"  Error: {response.text}")
                    results[name] = None
                    
            except Exception as e:
                print(f"  Request failed: {e}")
                results[name] = None
        
        return results
    
    def test_bulk_operations(self):
        """Example: Bulk operations."""
        print("\n📦 Example: Bulk Operations")
        print("-" * 40)
        
        # Create multiple test documents
        test_documents = []
        for i in range(3):
            document = {
                "loanId": f"LOAN_BULK_API_{i+1:03d}",
                "amount": 200000 + (i * 50000),
                "rate": 6.0 + (i * 0.25),
                "term": 360,
                "borrower": {
                    "name": f"Borrower {i+1}",
                    "email": f"borrower{i+1}@example.com"
                }
            }
            
            document_json = json.dumps(document)
            document_base64 = base64.b64encode(document_json.encode()).decode()
            
            test_documents.append({
                "filename": f"bulk_test_{i+1}.json",
                "content_type": "application/json",
                "file_content": document_base64
            })
        
        request_data = {"documents": test_documents}
        
        print("Request:")
        print(json.dumps({
            "documents": [
                {
                    "filename": doc["filename"],
                    "content_type": doc["content_type"],
                    "file_content": f"[Base64 encoded, {len(doc['file_content'])} characters]"
                }
                for doc in test_documents
            ]
        }, indent=2))
        
        try:
            response = self.session.post(
                f"{self.api_base}/ai/analyze-batch",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\nResponse Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("Response:")
                print(json.dumps(result, indent=2))
                return result
            else:
                print(f"Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def run_all_examples(self):
        """Run all API examples."""
        print("🚀 IntegrityX API Test Examples")
        print("=" * 50)
        
        print("\n💡 Note: These examples show how to use the IntegrityX API endpoints.")
        print("   Make sure the server is running on http://localhost:8000")
        
        # Test document upload
        upload_result = self.test_document_upload()
        
        # Test AI document processing
        ai_result = self.test_ai_document_processing()
        
        # Test document signing
        signing_result = self.test_document_signing()
        
        # Test analytics
        analytics_result = self.test_analytics()
        
        # Test bulk operations
        bulk_result = self.test_bulk_operations()
        
        print("\n" + "=" * 50)
        print("🎯 API Test Examples Summary")
        print("=" * 50)
        
        examples = [
            ("Document Upload", upload_result is not None),
            ("AI Document Processing", ai_result is not None),
            ("Document Signing", signing_result is not None),
            ("Analytics", analytics_result is not None),
            ("Bulk Operations", bulk_result is not None)
        ]
        
        for name, success in examples:
            if success:
                print(f"✅ {name}: Example completed")
            else:
                print(f"❌ {name}: Example failed")
        
        successful = sum(1 for _, success in examples if success)
        total = len(examples)
        
        print(f"\n📊 Examples: {successful}/{total} completed")
        
        if successful == total:
            print("🎉 All API examples completed successfully!")
        else:
            print("⚠️ Some API examples failed. Check server status.")


def main():
    """Main function to run API examples."""
    tester = IntegrityXAPITester()
    tester.run_all_examples()


if __name__ == "__main__":
    main()
