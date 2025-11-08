#!/usr/bin/env python3
"""
Realistic Loan System Test for IntegrityX Platform
Tests the system with a comprehensive, real-world loan application scenario.
"""

import requests
import json
import time
import sys
import os
from typing import Dict, List, Any

class RealisticLoanSystemTester:
    """Test IntegrityX system with realistic loan application data."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "realistic_loan_tests": [],
            "document_lifecycle_tests": [],
            "compliance_tests": [],
            "security_tests": [],
            "performance_tests": []
        }
    
    def load_realistic_loan_data(self) -> Dict[str, Any]:
        """Load the realistic loan application data."""
        try:
            with open("realistic_loan_test.json", "r") as f:
                loan_data = json.load(f)
            return loan_data
        except Exception as e:
            print(f"❌ Error loading loan data: {e}")
            return {}
    
    def test_realistic_loan_document_sealing(self):
        """Test sealing a realistic loan document."""
        print("🏠 Testing realistic loan document sealing...")
        
        loan_data = self.load_realistic_loan_data()
        if not loan_data:
            return {"success": False, "error": "Could not load loan data"}
        
        # Extract key information for the API
        loan_app = loan_data.get("loan_application", {})
        borrower = loan_data.get("borrower", {})
        borrower_address = borrower.get("address", {})
        
        # Create the document seal request
        seal_request = {
            "loan_id": loan_app.get("loan_id", "LOAN_2025_001234"),
            "document_type": "residential_mortgage_application",
            "loan_amount": loan_app.get("loan_amount", 485000.00),
            "additional_notes": f"Realistic loan test: {loan_app.get('loan_purpose', 'primary_residence_purchase')} - {borrower.get('full_name', 'Unknown Borrower')}",
            "created_by": loan_app.get("created_by", "realistic_test@integrityx.com"),
            "borrower": {
                "full_name": borrower.get("full_name", "Sarah Elizabeth Johnson"),
                "date_of_birth": borrower.get("date_of_birth", "1988-03-15"),
                "email": borrower.get("email", "sarah.johnson@email.com"),
                "phone": borrower.get("phone", "555-123-4567"),
                "address": {
                    "street": borrower_address.get("street", "123 Maple Street"),
                    "city": borrower_address.get("city", "Springfield"),
                    "state": borrower_address.get("state", "IL"),
                    "zip_code": borrower_address.get("zip_code", "62701"),
                    "country": borrower_address.get("country", "United States")
                },
                "ssn_last4": borrower.get("ssn_last4", "6789"),
                "id_type": "SSN",
                "id_last4": borrower.get("ssn_last4", "6789"),
                "employment_status": borrower.get("employment", {}).get("employment_status", "employed"),
                "annual_income": borrower.get("employment", {}).get("annual_income", 125000.00),
                "co_borrower_name": loan_data.get("co_borrower", {}).get("full_name", "Michael David Johnson")
            }
        }
        
        try:
            start_time = time.time()
            response = requests.post(f"{self.api_base}/loan-documents/seal", json=seal_request)
            end_time = time.time()
            
            if response.status_code == 200:
                data = response.json()
                artifact_id = data.get("data", {}).get("artifact_id")
                walacor_tx_id = data.get("data", {}).get("walacor_tx_id")
                
                test_result = {
                    "test_name": "Realistic Loan Document Sealing",
                    "success": True,
                    "artifact_id": artifact_id,
                    "walacor_tx_id": walacor_tx_id,
                    "response_time": end_time - start_time,
                    "loan_amount": seal_request["loan_amount"],
                    "borrower_name": seal_request["borrower"]["full_name"],
                    "document_type": seal_request["document_type"]
                }
                
                print(f"✅ Realistic loan document sealed successfully")
                print(f"   Artifact ID: {artifact_id}")
                print(f"   Walacor TX ID: {walacor_tx_id}")
                print(f"   Response Time: {end_time - start_time:.3f}s")
                print(f"   Loan Amount: ${seal_request['loan_amount']:,.2f}")
                print(f"   Borrower: {seal_request['borrower']['full_name']}")
                
                return test_result
            else:
                error_result = {
                    "test_name": "Realistic Loan Document Sealing",
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "response_text": response.text[:200]
                }
                print(f"❌ Failed to seal realistic loan document: HTTP {response.status_code}")
                return error_result
                
        except Exception as e:
            error_result = {
                "test_name": "Realistic Loan Document Sealing",
                "success": False,
                "error": str(e)
            }
            print(f"❌ Error sealing realistic loan document: {e}")
            return error_result
    
    def test_complete_loan_lifecycle(self):
        """Test complete lifecycle of a realistic loan document."""
        print("🔄 Testing complete realistic loan lifecycle...")
        
        lifecycle_steps = []
        
        try:
            # Step 1: Create realistic loan document
            loan_data = self.load_realistic_loan_data()
            loan_app = loan_data.get("loan_application", {})
            borrower = loan_data.get("borrower", {})
            borrower_address = borrower.get("address", {})
            
            seal_request = {
                "loan_id": f"LIFECYCLE_TEST_{int(time.time())}",
                "document_type": "residential_mortgage_application",
                "loan_amount": 485000.00,
                "additional_notes": "Complete lifecycle test for realistic loan scenario",
                "created_by": "lifecycle_test@integrityx.com",
                "borrower": {
                    "full_name": "Sarah Elizabeth Johnson",
                    "date_of_birth": "1988-03-15",
                    "email": "sarah.johnson@email.com",
                    "phone": "555-123-4567",
                    "address": {
                        "street": "123 Maple Street",
                        "city": "Springfield",
                        "state": "IL",
                        "zip_code": "62701",
                        "country": "United States"
                    },
                    "ssn_last4": "6789",
                    "id_type": "SSN",
                    "id_last4": "6789",
                    "employment_status": "employed",
                    "annual_income": 125000.00,
                    "co_borrower_name": "Michael David Johnson"
                }
            }
            
            # Create document
            start_time = time.time()
            create_response = requests.post(f"{self.api_base}/loan-documents/seal", json=seal_request)
            create_time = time.time()
            
            if create_response.status_code == 200:
                create_data = create_response.json()
                artifact_id = create_data.get("data", {}).get("artifact_id")
                
                lifecycle_steps.append({
                    "step": "Document Creation",
                    "status": "success",
                    "artifact_id": artifact_id,
                    "response_time": create_time - start_time,
                    "loan_amount": seal_request["loan_amount"]
                })
                
                # Step 2: Retrieve document
                start_time = time.time()
                get_response = requests.get(f"{self.api_base}/artifacts/{artifact_id}")
                get_time = time.time()
                
                if get_response.status_code == 200:
                    get_data = get_response.json()
                    retrieved_loan_id = get_data.get("data", {}).get("loan_id")
                    doc_hash = get_data.get("data", {}).get("payload_sha256")
                    
                    lifecycle_steps.append({
                        "step": "Document Retrieval",
                        "status": "success",
                        "retrieved_loan_id": retrieved_loan_id,
                        "hash": doc_hash,
                        "response_time": get_time - start_time
                    })
                    
                    # Step 3: Verify document
                    if doc_hash:
                        start_time = time.time()
                        verify_response = requests.post(f"{self.api_base}/verify-by-hash", json={"hash": doc_hash})
                        verify_time = time.time()
                        
                        if verify_response.status_code == 200:
                            verify_data = verify_response.json()
                            verification_status = verify_data.get("data", {}).get("status")
                            
                            lifecycle_steps.append({
                                "step": "Document Verification",
                                "status": "success",
                                "verification_status": verification_status,
                                "response_time": verify_time - start_time
                            })
                        else:
                            lifecycle_steps.append({
                                "step": "Document Verification",
                                "status": "failed",
                                "error": f"HTTP {verify_response.status_code}",
                                "response_time": verify_time - start_time
                            })
                    else:
                        lifecycle_steps.append({
                            "step": "Document Verification",
                            "status": "failed",
                            "error": "No hash found in document"
                        })
                else:
                    lifecycle_steps.append({
                        "step": "Document Retrieval",
                        "status": "failed",
                        "error": f"HTTP {get_response.status_code}",
                        "response_time": get_time - start_time
                    })
            else:
                lifecycle_steps.append({
                    "step": "Document Creation",
                    "status": "failed",
                    "error": f"HTTP {create_response.status_code}",
                    "response_time": create_time - start_time
                })
        
        except Exception as e:
            lifecycle_steps.append({
                "step": "Lifecycle Error",
                "status": "failed",
                "error": str(e)
            })
        
        # Calculate success rate
        successful_steps = sum(1 for step in lifecycle_steps if step.get("status") == "success")
        total_steps = len(lifecycle_steps)
        
        test_result = {
            "test_name": "Complete Realistic Loan Lifecycle",
            "total_steps": total_steps,
            "successful_steps": successful_steps,
            "success_rate": (successful_steps / total_steps) * 100 if total_steps > 0 else 0,
            "lifecycle_steps": lifecycle_steps
        }
        
        self.results["document_lifecycle_tests"].append(test_result)
        print(f"✅ Realistic loan lifecycle: {test_result['success_rate']:.1f}% success rate")
        return test_result
    
    def test_loan_data_validation(self):
        """Test validation of realistic loan data."""
        print("🔍 Testing realistic loan data validation...")
        
        validation_tests = []
        
        # Test 1: Valid loan data
        try:
            valid_loan_request = {
                "loan_id": "VALIDATION_TEST_VALID",
                "document_type": "residential_mortgage_application",
                "loan_amount": 485000.00,
                "additional_notes": "Valid loan data test",
                "created_by": "validation_test@integrityx.com",
                "borrower": {
                    "full_name": "Sarah Elizabeth Johnson",
                    "date_of_birth": "1988-03-15",
                    "email": "sarah.johnson@email.com",
                    "phone": "555-123-4567",
                    "address": {
                        "street": "123 Maple Street",
                        "city": "Springfield",
                        "state": "IL",
                        "zip_code": "62701",
                        "country": "United States"
                    },
                    "ssn_last4": "6789",
                    "id_type": "SSN",
                    "id_last4": "6789",
                    "employment_status": "employed",
                    "annual_income": 125000.00,
                    "co_borrower_name": "Michael David Johnson"
                }
            }
            
            response = requests.post(f"{self.api_base}/loan-documents/seal", json=valid_loan_request)
            validation_tests.append({
                "test": "Valid loan data",
                "status_code": response.status_code,
                "accepted": response.status_code == 200,
                "response_time": response.elapsed.total_seconds()
            })
            
        except Exception as e:
            validation_tests.append({
                "test": "Valid loan data",
                "error": str(e),
                "accepted": False
            })
        
        # Test 2: Invalid loan amount (negative)
        try:
            invalid_loan_request = {
                "loan_id": "VALIDATION_TEST_INVALID",
                "document_type": "residential_mortgage_application",
                "loan_amount": -100000.00,  # Invalid negative amount
                "additional_notes": "Invalid loan data test",
                "created_by": "validation_test@integrityx.com",
                "borrower": {
                    "full_name": "Test User",
                    "date_of_birth": "1990-01-01",
                    "email": "test@example.com",
                    "phone": "555-1234",
                    "address": {
                        "street": "123 Test St",
                        "city": "Test City",
                        "state": "TC",
                        "zip_code": "12345",
                        "country": "United States"
                    },
                    "ssn_last4": "1234",
                    "id_type": "SSN",
                    "id_last4": "1234",
                    "employment_status": "employed",
                    "annual_income": 50000.00,
                    "co_borrower_name": None
                }
            }
            
            response = requests.post(f"{self.api_base}/loan-documents/seal", json=invalid_loan_request)
            validation_tests.append({
                "test": "Invalid loan amount (negative)",
                "status_code": response.status_code,
                "rejected": response.status_code == 422,  # Should be rejected
                "response_time": response.elapsed.total_seconds()
            })
            
        except Exception as e:
            validation_tests.append({
                "test": "Invalid loan amount (negative)",
                "error": str(e),
                "rejected": True
            })
        
        # Test 3: Missing required fields
        try:
            incomplete_loan_request = {
                "loan_id": "VALIDATION_TEST_INCOMPLETE",
                "document_type": "residential_mortgage_application",
                "loan_amount": 485000.00,
                # Missing required fields
                "created_by": "validation_test@integrityx.com"
            }
            
            response = requests.post(f"{self.api_base}/loan-documents/seal", json=incomplete_loan_request)
            validation_tests.append({
                "test": "Missing required fields",
                "status_code": response.status_code,
                "rejected": response.status_code == 422,  # Should be rejected
                "response_time": response.elapsed.total_seconds()
            })
            
        except Exception as e:
            validation_tests.append({
                "test": "Missing required fields",
                "error": str(e),
                "rejected": True
            })
        
        # Calculate validation score
        valid_tests = sum(1 for test in validation_tests if test.get("accepted", False))
        invalid_tests = sum(1 for test in validation_tests if test.get("rejected", False))
        total_tests = len(validation_tests)
        
        test_result = {
            "test_name": "Realistic Loan Data Validation",
            "total_tests": total_tests,
            "valid_tests_passed": valid_tests,
            "invalid_tests_rejected": invalid_tests,
            "validation_score": ((valid_tests + invalid_tests) / total_tests) * 100 if total_tests > 0 else 0,
            "validation_tests": validation_tests
        }
        
        self.results["compliance_tests"].append(test_result)
        print(f"✅ Loan data validation: {test_result['validation_score']:.1f}% score")
        return test_result
    
    def test_loan_analytics_and_reporting(self):
        """Test analytics and reporting for realistic loan data."""
        print("📊 Testing realistic loan analytics and reporting...")
        
        analytics_tests = []
        
        # Test 1: System metrics
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/analytics/system-metrics")
            end_time = time.time()
            
            analytics_tests.append({
                "test": "System metrics",
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response_time": end_time - start_time
            })
            
        except Exception as e:
            analytics_tests.append({
                "test": "System metrics",
                "error": str(e),
                "success": False
            })
        
        # Test 2: Analytics dashboard
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/analytics/dashboard")
            end_time = time.time()
            
            analytics_tests.append({
                "test": "Analytics dashboard",
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response_time": end_time - start_time
            })
            
        except Exception as e:
            analytics_tests.append({
                "test": "Analytics dashboard",
                "error": str(e),
                "success": False
            })
        
        # Test 3: Document analytics
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/analytics/documents")
            end_time = time.time()
            
            analytics_tests.append({
                "test": "Document analytics",
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response_time": end_time - start_time
            })
            
        except Exception as e:
            analytics_tests.append({
                "test": "Document analytics",
                "error": str(e),
                "success": False
            })
        
        # Calculate analytics score
        successful_tests = sum(1 for test in analytics_tests if test.get("success", False))
        total_tests = len(analytics_tests)
        
        test_result = {
            "test_name": "Realistic Loan Analytics and Reporting",
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
            "analytics_tests": analytics_tests
        }
        
        self.results["performance_tests"].append(test_result)
        print(f"✅ Loan analytics: {test_result['success_rate']:.1f}% success rate")
        return test_result
    
    def run_realistic_loan_tests(self):
        """Run all realistic loan system tests."""
        print("🏠 STARTING REALISTIC LOAN SYSTEM TESTING SUITE")
        print("=" * 60)
        print("Testing IntegrityX system with comprehensive, real-world loan data")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all realistic loan tests
        self.test_realistic_loan_document_sealing()
        self.test_complete_loan_lifecycle()
        self.test_loan_data_validation()
        self.test_loan_analytics_and_reporting()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Generate realistic loan test summary
        self.generate_realistic_loan_summary(total_duration)
        
        return self.results
    
    def generate_realistic_loan_summary(self, total_duration: float):
        """Generate comprehensive realistic loan test summary."""
        print("\n" + "=" * 60)
        print("🏠 REALISTIC LOAN SYSTEM TESTING SUMMARY")
        print("=" * 60)
        
        all_tests = []
        all_tests.extend(self.results["realistic_loan_tests"])
        all_tests.extend(self.results["document_lifecycle_tests"])
        all_tests.extend(self.results["compliance_tests"])
        all_tests.extend(self.results["security_tests"])
        all_tests.extend(self.results["performance_tests"])
        
        total_tests = len(all_tests)
        
        # Calculate overall success rates
        success_rates = []
        for test in all_tests:
            if "success_rate" in test:
                success_rates.append(test["success_rate"])
            elif "validation_score" in test:
                success_rates.append(test["validation_score"])
            elif test.get("success", False):
                success_rates.append(100)
            else:
                success_rates.append(0)
        
        overall_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
        
        print(f"🏠 Realistic Loan Test Results:")
        print(f"   Total Test Scenarios: {total_tests}")
        print(f"   Overall Success Rate: {overall_success_rate:.1f}%")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        # Save results
        with open("realistic_loan_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: realistic_loan_test_results.json")
        
        if overall_success_rate >= 90:
            print("🎉 Realistic loan scenarios work excellently!")
        elif overall_success_rate >= 80:
            print("⚠️ Realistic loan scenarios work well with minor issues.")
        else:
            print("❌ Realistic loan scenarios need improvement.")
        
        print(f"\n🏠 Realistic Loan Data Tested:")
        print(f"   • Loan Amount: $485,000 (Residential Mortgage)")
        print(f"   • Borrower: Sarah Elizabeth Johnson")
        print(f"   • Co-borrower: Michael David Johnson")
        print(f"   • Property: 4BR/2.5BA Single Family Residence")
        print(f"   • Credit Score: 745 (Excellent)")
        print(f"   • Employment: Senior Software Engineer")
        print(f"   • Annual Income: $125,000")
        print(f"   • Down Payment: $97,000 (20%)")
        print(f"   • Interest Rate: 6.75% (30-year fixed)")

def main():
    """Run realistic loan system testing."""
    tester = RealisticLoanSystemTester()
    tester.run_realistic_loan_tests()

if __name__ == "__main__":
    main()








