"""
Comprehensive IntegrityX Test Sample

This file demonstrates how to test all the implemented features including:
- Document upload and management
- AI-powered document processing
- Bulk operations with ObjectValidator
- Document signing integration
- Analytics and reporting
"""

import json
import requests
import base64
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class IntegrityXTestClient:
    """Comprehensive test client for IntegrityX platform."""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.session = requests.Session()
        
    def test_health_check(self) -> bool:
        """Test if the server is running."""
        try:
            response = self.session.get(f"{self.base_url}/health")
            return response.status_code == 200
        except:
            return False
    
    def test_document_upload(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test document upload functionality."""
        try:
            # Create a test document
            test_document = {
                "loan_id": "LOAN_TEST_001",
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
            
            # Upload document
            response = self.session.post(
                f"{self.api_base}/artifacts",
                json=test_document,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Document upload successful")
                print(f"   Document ID: {result.get('data', {}).get('artifact_id')}")
                return result
            else:
                print(f"❌ Document upload failed: {response.status_code}")
                return {"error": f"Upload failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Document upload error: {e}")
            return {"error": str(e)}
    
    def test_ai_document_processing(self, document_id: str) -> Dict[str, Any]:
        """Test AI document processing functionality."""
        try:
            # Create sample document for AI processing
            sample_document = {
                "loanId": "LOAN_AI_TEST_001",
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
            
            # Test AI document analysis
            response = self.session.post(
                f"{self.api_base}/ai/analyze-document-json",
                json={
                    "filename": "test_loan_application.json",
                    "content_type": "application/json",
                    "file_content": document_base64
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ AI document processing successful")
                analysis = result.get('data', {}).get('analysis_result', {})
                print(f"   Document Type: {analysis.get('document_type')}")
                print(f"   Classification Confidence: {analysis.get('classification_confidence', 0):.2f}")
                print(f"   Quality Score: {analysis.get('quality_score', 0):.2f}")
                print(f"   Risk Score: {analysis.get('risk_score', 0):.2f}")
                return result
            else:
                print(f"❌ AI document processing failed: {response.status_code}")
                return {"error": f"AI processing failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ AI document processing error: {e}")
            return {"error": str(e)}
    
    def test_bulk_operations(self) -> Dict[str, Any]:
        """Test bulk operations functionality."""
        try:
            # Create multiple test documents for bulk processing
            test_documents = []
            for i in range(3):
                document = {
                    "loanId": f"LOAN_BULK_{i+1:03d}",
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
            
            # Test bulk AI processing
            response = self.session.post(
                f"{self.api_base}/ai/analyze-batch",
                json={"documents": test_documents},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Bulk operations successful")
                summary = result.get('data', {}).get('batch_analysis_result', {}).get('summary', {})
                print(f"   Total Documents: {summary.get('total_documents', 0)}")
                print(f"   Successful Analyses: {summary.get('successful_analyses', 0)}")
                print(f"   Success Rate: {summary.get('success_rate', 0):.1f}%")
                return result
            else:
                print(f"❌ Bulk operations failed: {response.status_code}")
                return {"error": f"Bulk operations failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Bulk operations error: {e}")
            return {"error": str(e)}
    
    def test_document_signing(self) -> Dict[str, Any]:
        """Test document signing functionality."""
        try:
            # Create signing envelope
            signing_request = {
                "document_id": "DOC_SIGNING_TEST_001",
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
            
            # Create signing envelope
            response = self.session.post(
                f"{self.api_base}/signing/create-envelope",
                json=signing_request,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Document signing envelope creation successful")
                signing_result = result.get('data', {}).get('signing_result', {})
                envelope_id = signing_result.get('envelope_id')
                print(f"   Envelope ID: {envelope_id}")
                print(f"   Status: {signing_result.get('status')}")
                
                # Test sending envelope
                if envelope_id:
                    send_response = self.session.post(
                        f"{self.api_base}/signing/send-envelope",
                        params={"envelope_id": envelope_id, "provider": "docusign"}
                    )
                    
                    if send_response.status_code == 200:
                        print("✅ Document signing envelope sending successful")
                        send_result = send_response.json()
                        print(f"   Status: {send_result.get('data', {}).get('signing_result', {}).get('status')}")
                    else:
                        print(f"❌ Document signing envelope sending failed: {send_response.status_code}")
                
                return result
            else:
                print(f"❌ Document signing failed: {response.status_code}")
                return {"error": f"Document signing failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Document signing error: {e}")
            return {"error": str(e)}
    
    def test_analytics(self) -> Dict[str, Any]:
        """Test analytics functionality."""
        try:
            # Test system metrics
            response = self.session.get(f"{self.api_base}/analytics/system-metrics")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Analytics system metrics successful")
                metrics = result.get('data', {}).get('metrics', {})
                print(f"   Total Documents: {metrics.get('total_documents', 0)}")
                print(f"   Active Documents: {metrics.get('active_documents', 0)}")
                print(f"   Deleted Documents: {metrics.get('deleted_documents', 0)}")
                
                # Test bulk operations analytics
                bulk_response = self.session.get(f"{self.api_base}/analytics/bulk-operations")
                if bulk_response.status_code == 200:
                    bulk_result = bulk_response.json()
                    print("✅ Bulk operations analytics successful")
                    bulk_metrics = bulk_result.get('data', {}).get('analytics', {}).get('bulk_operations_metrics', {})
                    print(f"   Total Bulk Operations: {bulk_metrics.get('total_bulk_operations', 0)}")
                    print(f"   Success Rate: {bulk_metrics.get('success_rate', 0):.1f}%")
                
                return result
            else:
                print(f"❌ Analytics failed: {response.status_code}")
                return {"error": f"Analytics failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Analytics error: {e}")
            return {"error": str(e)}
    
    def test_document_verification(self, document_hash: str) -> Dict[str, Any]:
        """Test document verification functionality."""
        try:
            # Test hash verification
            response = self.session.post(
                f"{self.api_base}/verify-by-hash",
                json={"hash": document_hash},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Document verification successful")
                verification = result.get('data', {}).get('verification_result', {})
                print(f"   Document Found: {verification.get('document_found', False)}")
                print(f"   Verification Status: {verification.get('status')}")
                return result
            else:
                print(f"❌ Document verification failed: {response.status_code}")
                return {"error": f"Document verification failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Document verification error: {e}")
            return {"error": str(e)}
    
    def test_document_deletion(self, document_id: str) -> Dict[str, Any]:
        """Test document deletion functionality."""
        try:
            # Test document deletion
            response = self.session.delete(
                f"{self.api_base}/artifacts/{document_id}",
                json={"reason": "Test deletion", "deleted_by": "test_user@example.com"},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Document deletion successful")
                deletion = result.get('data', {}).get('deletion_result', {})
                print(f"   Deletion Status: {deletion.get('status')}")
                print(f"   Deleted Document ID: {deletion.get('deleted_document_id')}")
                return result
            else:
                print(f"❌ Document deletion failed: {response.status_code}")
                return {"error": f"Document deletion failed: {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Document deletion error: {e}")
            return {"error": str(e)}
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive test of all IntegrityX features."""
        print("🚀 STARTING COMPREHENSIVE INTEGRITYX TEST")
        print("=" * 60)
        
        results = {}
        
        # Test 1: Health Check
        print("\n🧪 Test 1: Health Check")
        print("-" * 50)
        if self.test_health_check():
            print("✅ Server is running and healthy")
            results["health_check"] = True
        else:
            print("❌ Server is not running or unhealthy")
            results["health_check"] = False
            return results
        
        # Test 2: Document Upload
        print("\n🧪 Test 2: Document Upload")
        print("-" * 50)
        upload_result = self.test_document_upload({})
        results["document_upload"] = upload_result
        
        # Test 3: AI Document Processing
        print("\n🧪 Test 3: AI Document Processing")
        print("-" * 50)
        ai_result = self.test_ai_document_processing("test_doc")
        results["ai_processing"] = ai_result
        
        # Test 4: Bulk Operations
        print("\n🧪 Test 4: Bulk Operations")
        print("-" * 50)
        bulk_result = self.test_bulk_operations()
        results["bulk_operations"] = bulk_result
        
        # Test 5: Document Signing
        print("\n🧪 Test 5: Document Signing")
        print("-" * 50)
        signing_result = self.test_document_signing()
        results["document_signing"] = signing_result
        
        # Test 6: Analytics
        print("\n🧪 Test 6: Analytics")
        print("-" * 50)
        analytics_result = self.test_analytics()
        results["analytics"] = analytics_result
        
        # Test 7: Document Verification
        print("\n🧪 Test 7: Document Verification")
        print("-" * 50)
        verification_result = self.test_document_verification("test_hash")
        results["document_verification"] = verification_result
        
        # Test 8: Document Deletion
        print("\n🧪 Test 8: Document Deletion")
        print("-" * 50)
        deletion_result = self.test_document_deletion("test_doc_id")
        results["document_deletion"] = deletion_result
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        successful_tests = 0
        total_tests = len(results)
        
        for test_name, result in results.items():
            if isinstance(result, dict) and "error" not in result:
                successful_tests += 1
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n📊 Test Results: {successful_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🎉 IntegrityX platform is working excellently!")
        elif success_rate >= 60:
            print("⚠️ IntegrityX platform is working well with some issues.")
        else:
            print("❌ IntegrityX platform needs attention.")
        
        results["summary"] = {
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "success_rate": success_rate
        }
        
        return results


def main():
    """Main function to run comprehensive tests."""
    print("IntegrityX Comprehensive Test Suite")
    print("==================================")
    
    # Initialize test client
    client = IntegrityXTestClient()
    
    # Run comprehensive tests
    results = client.run_comprehensive_test()
    
    # Save results to file
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Test results saved to test_results.json")
    
    return results


if __name__ == "__main__":
    main()
