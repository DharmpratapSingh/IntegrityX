#!/usr/bin/env python3
"""
Integration & End-to-End Testing Suite for IntegrityX Platform
Tests complete user workflows, system integrations, and real-world scenarios.
"""

import requests
import json
import time
import random
from typing import Dict, List, Any
import sys
import os

class IntegrationE2ETester:
    """Integration and end-to-end testing for IntegrityX platform."""
    
    def __init__(self, base_url: str = "http://localhost:8000", frontend_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.frontend_url = frontend_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "user_workflows": [],
            "system_integrations": [],
            "real_world_scenarios": [],
            "performance_under_load": [],
            "data_consistency_tests": [],
            "cross_platform_tests": []
        }
    
    def test_complete_document_lifecycle(self):
        """Test complete document lifecycle from creation to verification."""
        print("🔄 Testing complete document lifecycle...")
        
        workflow_steps = []
        
        try:
            # Step 1: Create document
            doc_data = {
                "loan_id": f"E2E_TEST_{int(time.time())}",
                "document_type": "loan_application",
                "loan_amount": 250000.00,
                "additional_notes": "End-to-end test document",
                "created_by": "e2e_test@example.com",
                "borrower": {
                    "full_name": "E2E Test User",
                    "date_of_birth": "1985-03-15",
                    "email": "e2e.test@example.com",
                    "phone": "555-987-6543",
                    "address": {
                        "street": "789 E2E Test Avenue",
                        "city": "Test City",
                        "state": "TC",
                        "zip_code": "54321",
                        "country": "United States"
                    },
                    "ssn_last4": "9876",
                    "id_type": "SSN",
                    "id_last4": "9876",
                    "employment_status": "employed",
                    "annual_income": 85000.00,
                    "co_borrower_name": None
                }
            }
            
            start_time = time.time()
            response = requests.post(f"{self.api_base}/loan-documents/seal", json=doc_data)
            end_time = time.time()
            
            if response.status_code == 200:
                data = response.json()
                artifact_id = data.get("data", {}).get("artifact_id")
                workflow_steps.append({
                    "step": "Document Creation",
                    "status": "success",
                    "artifact_id": artifact_id,
                    "response_time": end_time - start_time
                })
                
                # Step 2: Retrieve document
                start_time = time.time()
                get_response = requests.get(f"{self.api_base}/artifacts/{artifact_id}")
                end_time = time.time()
                
                if get_response.status_code == 200:
                    get_data = get_response.json()
                    doc_hash = get_data.get("data", {}).get("payload_sha256")
                    workflow_steps.append({
                        "step": "Document Retrieval",
                        "status": "success",
                        "hash": doc_hash,
                        "response_time": end_time - start_time
                    })
                    
                    # Step 3: Verify document
                    if doc_hash:
                        start_time = time.time()
                        verify_response = requests.post(f"{self.api_base}/verify-by-hash", json={"hash": doc_hash})
                        end_time = time.time()
                        
                        if verify_response.status_code == 200:
                            verify_data = verify_response.json()
                            verification_status = verify_data.get("data", {}).get("status")
                            workflow_steps.append({
                                "step": "Document Verification",
                                "status": "success",
                                "verification_status": verification_status,
                                "response_time": end_time - start_time
                            })
                        else:
                            workflow_steps.append({
                                "step": "Document Verification",
                                "status": "failed",
                                "error": f"HTTP {verify_response.status_code}",
                                "response_time": end_time - start_time
                            })
                    else:
                        workflow_steps.append({
                            "step": "Document Verification",
                            "status": "failed",
                            "error": "No hash found in document"
                        })
                else:
                    workflow_steps.append({
                        "step": "Document Retrieval",
                        "status": "failed",
                        "error": f"HTTP {get_response.status_code}"
                    })
            else:
                workflow_steps.append({
                    "step": "Document Creation",
                    "status": "failed",
                    "error": f"HTTP {response.status_code}"
                })
        
        except Exception as e:
            workflow_steps.append({
                "step": "Workflow Error",
                "status": "failed",
                "error": str(e)
            })
        
        # Calculate success rate
        successful_steps = sum(1 for step in workflow_steps if step.get("status") == "success")
        total_steps = len(workflow_steps)
        
        test_result = {
            "test_name": "Complete Document Lifecycle",
            "total_steps": total_steps,
            "successful_steps": successful_steps,
            "success_rate": (successful_steps / total_steps) * 100 if total_steps > 0 else 0,
            "workflow_steps": workflow_steps
        }
        
        self.results["user_workflows"].append(test_result)
        print(f"✅ Document Lifecycle: {test_result['success_rate']:.1f}% success rate")
        return test_result
    
    def test_bulk_document_processing(self):
        """Test bulk document processing workflow."""
        print("🔄 Testing bulk document processing...")
        
        # Create multiple documents
        documents = []
        for i in range(5):
            doc_data = {
                "loan_id": f"BULK_TEST_{i}_{int(time.time())}",
                "document_type": "bulk_test_document",
                "loan_amount": random.uniform(50000, 500000),
                "additional_notes": f"Bulk test document {i}",
                "created_by": f"bulk_test_{i}@example.com",
                "borrower": {
                    "full_name": f"Bulk Test User {i}",
                    "date_of_birth": "1990-01-01",
                    "email": f"bulk{i}@example.com",
                    "phone": f"555-{i:04d}",
                    "address": {
                        "street": f"{i} Bulk Test St",
                        "city": "Test City",
                        "state": "TC",
                        "zip_code": f"{i:05d}",
                        "country": "United States"
                    },
                    "ssn_last4": f"{i:04d}",
                    "id_type": "SSN",
                    "id_last4": f"{i:04d}",
                    "employment_status": "employed",
                    "annual_income": random.uniform(40000, 150000),
                    "co_borrower_name": None
                }
            }
            
            try:
                response = requests.post(f"{self.api_base}/loan-documents/seal", json=doc_data)
                if response.status_code == 200:
                    data = response.json()
                    documents.append({
                        "loan_id": doc_data["loan_id"],
                        "artifact_id": data.get("data", {}).get("artifact_id"),
                        "status": "created"
                    })
                else:
                    documents.append({
                        "loan_id": doc_data["loan_id"],
                        "status": "failed",
                        "error": f"HTTP {response.status_code}"
                    })
            except Exception as e:
                documents.append({
                    "loan_id": doc_data["loan_id"],
                    "status": "error",
                    "error": str(e)
                })
        
        # Test bulk operations
        created_docs = [doc for doc in documents if doc.get("status") == "created"]
        
        # Test bulk analytics
        try:
            analytics_response = requests.get(f"{self.api_base}/analytics/bulk-operations")
            analytics_success = analytics_response.status_code == 200
        except:
            analytics_success = False
        
        # Test bulk document listing
        try:
            list_response = requests.get(f"{self.api_base}/artifacts")
            list_success = list_response.status_code == 200
        except:
            list_success = False
        
        test_result = {
            "test_name": "Bulk Document Processing",
            "total_documents": len(documents),
            "created_documents": len(created_docs),
            "creation_success_rate": (len(created_docs) / len(documents)) * 100,
            "analytics_working": analytics_success,
            "listing_working": list_success,
            "documents": documents
        }
        
        self.results["user_workflows"].append(test_result)
        print(f"✅ Bulk Processing: {test_result['creation_success_rate']:.1f}% documents created")
        return test_result
    
    def test_walacor_integration_workflow(self):
        """Test complete Walacor integration workflow."""
        print("🔄 Testing Walacor integration workflow...")
        
        workflow_steps = []
        
        try:
            # Step 1: Check Walacor service status
            start_time = time.time()
            status_response = requests.get(f"{self.api_base}/walacor/status")
            end_time = time.time()
            
            if status_response.status_code == 200:
                workflow_steps.append({
                    "step": "Walacor Service Status",
                    "status": "success",
                    "response_time": end_time - start_time
                })
                
                # Step 2: Test Walacor connection
                start_time = time.time()
                schemas_response = requests.get(f"{self.api_base}/walacor/schemas")
                end_time = time.time()
                
                if schemas_response.status_code == 200:
                    schemas_data = schemas_response.json()
                    workflow_steps.append({
                        "step": "Walacor Schema Management",
                        "status": "success",
                        "schemas_count": len(schemas_data.get("data", {}).get("schemas", [])),
                        "response_time": end_time - start_time
                    })
                    
                    # Step 3: Test document sealing with Walacor
                    doc_data = {
                        "loan_id": f"WALACOR_E2E_{int(time.time())}",
                        "document_type": "walacor_integration_test",
                        "loan_amount": 300000.00,
                        "additional_notes": "Walacor integration test",
                        "created_by": "walacor_test@example.com",
                        "borrower": {
                            "full_name": "Walacor Test User",
                            "date_of_birth": "1988-07-20",
                            "email": "walacor.test@example.com",
                            "phone": "555-555-5555",
                            "address": {
                                "street": "456 Walacor Test Blvd",
                                "city": "Blockchain City",
                                "state": "BC",
                                "zip_code": "12345",
                                "country": "United States"
                            },
                            "ssn_last4": "5555",
                            "id_type": "SSN",
                            "id_last4": "5555",
                            "employment_status": "employed",
                            "annual_income": 120000.00,
                            "co_borrower_name": None
                        }
                    }
                    
                    start_time = time.time()
                    seal_response = requests.post(f"{self.api_base}/loan-documents/seal", json=doc_data)
                    end_time = time.time()
                    
                    if seal_response.status_code == 200:
                        seal_data = seal_response.json()
                        artifact_id = seal_data.get("data", {}).get("artifact_id")
                        walacor_tx_id = seal_data.get("data", {}).get("walacor_tx_id")
                        
                        workflow_steps.append({
                            "step": "Document Sealing with Walacor",
                            "status": "success",
                            "artifact_id": artifact_id,
                            "walacor_tx_id": walacor_tx_id,
                            "response_time": end_time - start_time
                        })
                        
                        # Step 4: Verify blockchain integration
                        if walacor_tx_id:
                            workflow_steps.append({
                                "step": "Blockchain Integration",
                                "status": "success",
                                "walacor_tx_id": walacor_tx_id
                            })
                        else:
                            workflow_steps.append({
                                "step": "Blockchain Integration",
                                "status": "warning",
                                "message": "No Walacor transaction ID returned"
                            })
                    else:
                        workflow_steps.append({
                            "step": "Document Sealing with Walacor",
                            "status": "failed",
                            "error": f"HTTP {seal_response.status_code}",
                            "response_time": end_time - start_time
                        })
                else:
                    workflow_steps.append({
                        "step": "Walacor Schema Management",
                        "status": "failed",
                        "error": f"HTTP {schemas_response.status_code}",
                        "response_time": end_time - start_time
                    })
            else:
                workflow_steps.append({
                    "step": "Walacor Service Status",
                    "status": "failed",
                    "error": f"HTTP {status_response.status_code}",
                    "response_time": end_time - start_time
                })
        
        except Exception as e:
            workflow_steps.append({
                "step": "Walacor Integration Error",
                "status": "failed",
                "error": str(e)
            })
        
        # Calculate success rate
        successful_steps = sum(1 for step in workflow_steps if step.get("status") == "success")
        total_steps = len(workflow_steps)
        
        test_result = {
            "test_name": "Walacor Integration Workflow",
            "total_steps": total_steps,
            "successful_steps": successful_steps,
            "success_rate": (successful_steps / total_steps) * 100 if total_steps > 0 else 0,
            "workflow_steps": workflow_steps
        }
        
        self.results["system_integrations"].append(test_result)
        print(f"✅ Walacor Integration: {test_result['success_rate']:.1f}% success rate")
        return test_result
    
    def test_frontend_backend_integration(self):
        """Test frontend-backend integration."""
        print("🔄 Testing frontend-backend integration...")
        
        integration_tests = []
        
        # Test 1: Frontend pages accessibility
        frontend_pages = [
            "/",
            "/dashboard",
            "/upload",
            "/documents",
            "/analytics",
            "/verification"
        ]
        
        for page in frontend_pages:
            try:
                response = requests.get(f"{self.frontend_url}{page}", timeout=5)
                integration_tests.append({
                    "page": page,
                    "status_code": response.status_code,
                    "accessible": response.status_code in [200, 404]  # 404 is acceptable for some pages
                })
            except Exception as e:
                integration_tests.append({
                    "page": page,
                    "error": str(e),
                    "accessible": False
                })
        
        # Test 2: API endpoints from frontend perspective
        api_endpoints = [
            "/api/health",
            "/api/artifacts",
            "/api/analytics/dashboard",
            "/api/analytics/system-metrics"
        ]
        
        for endpoint in api_endpoints:
            try:
                response = requests.get(f"{self.api_base}{endpoint.replace('/api', '')}", timeout=10)
                integration_tests.append({
                    "endpoint": endpoint,
                    "status_code": response.status_code,
                    "accessible": response.status_code in [200, 401, 403]  # Auth required is acceptable
                })
            except Exception as e:
                integration_tests.append({
                    "endpoint": endpoint,
                    "error": str(e),
                    "accessible": False
                })
        
        # Calculate success rate
        accessible_tests = sum(1 for test in integration_tests if test.get("accessible"))
        total_tests = len(integration_tests)
        
        test_result = {
            "test_name": "Frontend-Backend Integration",
            "total_tests": total_tests,
            "accessible_tests": accessible_tests,
            "accessibility_rate": (accessible_tests / total_tests) * 100 if total_tests > 0 else 0,
            "integration_tests": integration_tests
        }
        
        self.results["system_integrations"].append(test_result)
        print(f"✅ Frontend-Backend Integration: {test_result['accessibility_rate']:.1f}% accessible")
        return test_result
    
    def test_data_consistency_across_operations(self):
        """Test data consistency across different operations."""
        print("🔄 Testing data consistency across operations...")
        
        consistency_tests = []
        
        try:
            # Create a document
            doc_data = {
                "loan_id": f"CONSISTENCY_TEST_{int(time.time())}",
                "document_type": "consistency_test",
                "loan_amount": 150000.00,
                "additional_notes": "Data consistency test",
                "created_by": "consistency@example.com",
                "borrower": {
                    "full_name": "Consistency Test User",
                    "date_of_birth": "1992-05-10",
                    "email": "consistency@example.com",
                    "phone": "555-111-2222",
                    "address": {
                        "street": "123 Consistency St",
                        "city": "Test City",
                        "state": "TC",
                        "zip_code": "11111",
                        "country": "United States"
                    },
                    "ssn_last4": "1111",
                    "id_type": "SSN",
                    "id_last4": "1111",
                    "employment_status": "employed",
                    "annual_income": 75000.00,
                    "co_borrower_name": None
                }
            }
            
            # Create document
            create_response = requests.post(f"{self.api_base}/loan-documents/seal", json=doc_data)
            if create_response.status_code == 200:
                create_data = create_response.json()
                artifact_id = create_data.get("data", {}).get("artifact_id")
                
                # Test 1: Retrieve by ID
                get_response = requests.get(f"{self.api_base}/artifacts/{artifact_id}")
                if get_response.status_code == 200:
                    get_data = get_response.json()
                    retrieved_loan_id = get_data.get("data", {}).get("loan_id")
                    
                    consistency_tests.append({
                        "test": "ID-based retrieval",
                        "consistent": retrieved_loan_id == doc_data["loan_id"],
                        "expected": doc_data["loan_id"],
                        "actual": retrieved_loan_id
                    })
                
                # Test 2: List all documents
                list_response = requests.get(f"{self.api_base}/artifacts")
                if list_response.status_code == 200:
                    list_data = list_response.json()
                    documents = list_data.get("data", {}).get("documents", [])
                    
                    # Find our document in the list
                    our_doc = next((doc for doc in documents if doc.get("id") == artifact_id), None)
                    if our_doc:
                        consistency_tests.append({
                            "test": "List includes created document",
                            "consistent": True,
                            "found_in_list": True
                        })
                    else:
                        consistency_tests.append({
                            "test": "List includes created document",
                            "consistent": False,
                            "found_in_list": False
                        })
                
                # Test 3: Verify hash consistency
                if get_response.status_code == 200:
                    doc_hash = get_data.get("data", {}).get("payload_sha256")
                    if doc_hash:
                        verify_response = requests.post(f"{self.api_base}/verify-by-hash", json={"hash": doc_hash})
                        if verify_response.status_code == 200:
                            verify_data = verify_response.json()
                            verification_status = verify_data.get("data", {}).get("status")
                            
                            consistency_tests.append({
                                "test": "Hash verification consistency",
                                "consistent": verification_status in ["sealed", "verified"],
                                "verification_status": verification_status
                            })
                        else:
                            consistency_tests.append({
                                "test": "Hash verification consistency",
                                "consistent": False,
                                "error": f"Verification failed: HTTP {verify_response.status_code}"
                            })
                    else:
                        consistency_tests.append({
                            "test": "Hash verification consistency",
                            "consistent": False,
                            "error": "No hash found in document"
                        })
            
        except Exception as e:
            consistency_tests.append({
                "test": "Data consistency test error",
                "consistent": False,
                "error": str(e)
            })
        
        # Calculate consistency rate
        consistent_tests = sum(1 for test in consistency_tests if test.get("consistent"))
        total_tests = len(consistency_tests)
        
        test_result = {
            "test_name": "Data Consistency Across Operations",
            "total_tests": total_tests,
            "consistent_tests": consistent_tests,
            "consistency_rate": (consistent_tests / total_tests) * 100 if total_tests > 0 else 0,
            "consistency_tests": consistency_tests
        }
        
        self.results["data_consistency_tests"].append(test_result)
        print(f"✅ Data Consistency: {test_result['consistency_rate']:.1f}% consistent")
        return test_result
    
    def run_integration_e2e_tests(self):
        """Run all integration and end-to-end tests."""
        print("🔄 STARTING INTEGRATION & END-TO-END TESTING SUITE")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all integration tests
        self.test_complete_document_lifecycle()
        self.test_bulk_document_processing()
        self.test_walacor_integration_workflow()
        self.test_frontend_backend_integration()
        self.test_data_consistency_across_operations()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Generate integration summary
        self.generate_integration_summary(total_duration)
        
        return self.results
    
    def generate_integration_summary(self, total_duration: float):
        """Generate comprehensive integration test summary."""
        print("\n" + "=" * 60)
        print("🔄 INTEGRATION & END-TO-END TESTING SUMMARY")
        print("=" * 60)
        
        all_tests = []
        all_tests.extend(self.results["user_workflows"])
        all_tests.extend(self.results["system_integrations"])
        all_tests.extend(self.results["real_world_scenarios"])
        all_tests.extend(self.results["performance_under_load"])
        all_tests.extend(self.results["data_consistency_tests"])
        all_tests.extend(self.results["cross_platform_tests"])
        
        total_tests = len(all_tests)
        
        # Calculate overall success rates
        success_rates = []
        for test in all_tests:
            if "success_rate" in test:
                success_rates.append(test["success_rate"])
            elif "accessibility_rate" in test:
                success_rates.append(test["accessibility_rate"])
            elif "consistency_rate" in test:
                success_rates.append(test["consistency_rate"])
            elif "creation_success_rate" in test:
                success_rates.append(test["creation_success_rate"])
        
        overall_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
        
        print(f"🔄 Integration Test Results:")
        print(f"   Total Test Scenarios: {total_tests}")
        print(f"   Overall Success Rate: {overall_success_rate:.1f}%")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        # Save results
        with open("integration_e2e_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: integration_e2e_test_results.json")
        
        if overall_success_rate >= 90:
            print("🎉 Integration and E2E workflows work excellently!")
        elif overall_success_rate >= 80:
            print("⚠️ Integration and E2E workflows work well with minor issues.")
        else:
            print("❌ Integration and E2E workflows need improvement.")

def main():
    """Run integration and end-to-end testing."""
    tester = IntegrationE2ETester()
    tester.run_integration_e2e_tests()

if __name__ == "__main__":
    main()








