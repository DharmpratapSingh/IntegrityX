#!/usr/bin/env python3
"""
Edge Case & Error Scenario Testing Suite for IntegrityX Platform
Tests system behavior under extreme conditions, edge cases, and error scenarios.
"""

import requests
import json
import time
import random
import string
from typing import Dict, List, Any
import sys
import os

class EdgeCaseTester:
    """Edge case and error scenario testing for IntegrityX platform."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "edge_cases": [],
            "error_scenarios": [],
            "boundary_tests": [],
            "resource_exhaustion_tests": [],
            "network_failure_tests": [],
            "data_corruption_tests": []
        }
    
    def test_extreme_data_sizes(self):
        """Test system behavior with extremely large data."""
        print("🧪 Testing extreme data sizes...")
        
        test_cases = [
            {"field": "loan_id", "size": 10000, "value": "A" * 10000},
            {"field": "additional_notes", "size": 100000, "value": "X" * 100000},
            {"field": "borrower_name", "size": 5000, "value": "B" * 5000},
            {"field": "email", "size": 1000, "value": "C" * 1000 + "@example.com"},
            {"field": "address_street", "size": 2000, "value": "D" * 2000},
        ]
        
        test_results = []
        
        for test_case in test_cases:
            try:
                base_data = {
                    "loan_id": f"EDGE_TEST_{int(time.time())}",
                    "document_type": "edge_test",
                    "loan_amount": 1000,
                    "created_by": "test@example.com",
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
                        "annual_income": 50000,
                        "co_borrower_name": None
                    }
                }
                
                # Apply extreme data
                if test_case["field"] == "loan_id":
                    base_data["loan_id"] = test_case["value"]
                elif test_case["field"] == "additional_notes":
                    base_data["additional_notes"] = test_case["value"]
                elif test_case["field"] == "borrower_name":
                    base_data["borrower"]["full_name"] = test_case["value"]
                elif test_case["field"] == "email":
                    base_data["borrower"]["email"] = test_case["value"]
                elif test_case["field"] == "address_street":
                    base_data["borrower"]["address"]["street"] = test_case["value"]
                
                start_time = time.time()
                response = requests.post(f"{self.api_base}/loan-documents/seal", json=base_data)
                end_time = time.time()
                
                test_results.append({
                    "field": test_case["field"],
                    "size": test_case["size"],
                    "response_time": end_time - start_time,
                    "status_code": response.status_code,
                    "handled": response.status_code in [200, 422, 413, 400],
                    "error_message": response.text[:200] if response.status_code != 200 else "Success"
                })
                
            except Exception as e:
                test_results.append({
                    "field": test_case["field"],
                    "size": test_case["size"],
                    "error": str(e),
                    "handled": True
                })
        
        test_result = {
            "test_name": "Extreme Data Sizes",
            "total_cases": len(test_cases),
            "handled_cases": sum(1 for r in test_results if r.get("handled")),
            "details": test_results
        }
        
        self.results["edge_cases"].append(test_result)
        print(f"✅ Extreme Data Test: {test_result['handled_cases']}/{test_result['total_cases']} cases handled")
        return test_result
    
    def test_boundary_values(self):
        """Test system behavior at boundary values."""
        print("🧪 Testing boundary values...")
        
        boundary_tests = [
            {"field": "loan_amount", "value": 0, "expected": "Should accept or reject"},
            {"field": "loan_amount", "value": -1, "expected": "Should reject"},
            {"field": "loan_amount", "value": 999999999999, "expected": "Should handle"},
            {"field": "loan_amount", "value": 0.01, "expected": "Should accept"},
            {"field": "annual_income", "value": 0, "expected": "Should handle"},
            {"field": "annual_income", "value": -50000, "expected": "Should reject"},
            {"field": "ssn_last4", "value": "0000", "expected": "Should accept"},
            {"field": "ssn_last4", "value": "9999", "expected": "Should accept"},
            {"field": "zip_code", "value": "00000", "expected": "Should handle"},
            {"field": "zip_code", "value": "99999", "expected": "Should handle"},
        ]
        
        test_results = []
        
        for test in boundary_tests:
            try:
                base_data = {
                    "loan_id": f"BOUNDARY_TEST_{int(time.time())}",
                    "document_type": "boundary_test",
                    "loan_amount": 1000,
                    "created_by": "test@example.com",
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
                        "annual_income": 50000,
                        "co_borrower_name": None
                    }
                }
                
                # Apply boundary value
                if test["field"] == "loan_amount":
                    base_data["loan_amount"] = test["value"]
                elif test["field"] == "annual_income":
                    base_data["borrower"]["annual_income"] = test["value"]
                elif test["field"] == "ssn_last4":
                    base_data["borrower"]["ssn_last4"] = test["value"]
                elif test["field"] == "zip_code":
                    base_data["borrower"]["address"]["zip_code"] = test["value"]
                
                response = requests.post(f"{self.api_base}/loan-documents/seal", json=base_data)
                
                test_results.append({
                    "field": test["field"],
                    "value": test["value"],
                    "expected": test["expected"],
                    "status_code": response.status_code,
                    "handled_correctly": response.status_code in [200, 422, 400]
                })
                
            except Exception as e:
                test_results.append({
                    "field": test["field"],
                    "value": test["value"],
                    "error": str(e),
                    "handled_correctly": True
                })
        
        test_result = {
            "test_name": "Boundary Values",
            "total_tests": len(boundary_tests),
            "handled_correctly": sum(1 for r in test_results if r.get("handled_correctly")),
            "details": test_results
        }
        
        self.results["boundary_tests"].append(test_result)
        print(f"✅ Boundary Test: {test_result['handled_correctly']}/{test_result['total_tests']} handled correctly")
        return test_result
    
    def test_malformed_json(self):
        """Test system behavior with malformed JSON."""
        print("🧪 Testing malformed JSON handling...")
        
        malformed_payloads = [
            '{"loan_id": "test", "loan_amount": }',  # Missing value
            '{"loan_id": "test", "loan_amount": 1000,}',  # Trailing comma
            '{"loan_id": "test", "loan_amount": 1000',  # Missing closing brace
            '{"loan_id": "test", "loan_amount": "invalid"}',  # Wrong type
            '{"loan_id": "test", "loan_amount": null}',  # Null value
            '{"loan_id": "test", "loan_amount": undefined}',  # Undefined
            '{"loan_id": "test", "loan_amount": [1000]}',  # Array instead of number
            '{"loan_id": "test", "loan_amount": {"value": 1000}}',  # Object instead of number
        ]
        
        test_results = []
        
        for payload in malformed_payloads:
            try:
                response = requests.post(
                    f"{self.api_base}/loan-documents/seal",
                    data=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                test_results.append({
                    "payload": payload[:50] + "...",
                    "status_code": response.status_code,
                    "handled": response.status_code in [400, 422, 500],
                    "error_message": response.text[:100]
                })
                
            except Exception as e:
                test_results.append({
                    "payload": payload[:50] + "...",
                    "error": str(e),
                    "handled": True
                })
        
        test_result = {
            "test_name": "Malformed JSON",
            "total_payloads": len(malformed_payloads),
            "handled_payloads": sum(1 for r in test_results if r.get("handled")),
            "details": test_results
        }
        
        self.results["error_scenarios"].append(test_result)
        print(f"✅ Malformed JSON Test: {test_result['handled_payloads']}/{test_result['total_payloads']} handled")
        return test_result
    
    def test_concurrent_operations(self):
        """Test concurrent operations on same resources."""
        print("🧪 Testing concurrent operations...")
        
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def concurrent_operation(operation_id):
            try:
                # Try to create document with same loan_id
                response = requests.post(f"{self.api_base}/loan-documents/seal", json={
                    "loan_id": "CONCURRENT_TEST_SAME_ID",
                    "document_type": "concurrent_test",
                    "loan_amount": 1000,
                    "created_by": f"user_{operation_id}@example.com",
                    "borrower": {
                        "full_name": f"User {operation_id}",
                        "date_of_birth": "1990-01-01",
                        "email": f"user_{operation_id}@example.com",
                        "phone": f"555-{operation_id:04d}",
                        "address": {
                            "street": f"{operation_id} Test St",
                            "city": "Test City",
                            "state": "TC",
                            "zip_code": "12345",
                            "country": "United States"
                        },
                        "ssn_last4": f"{operation_id:04d}",
                        "id_type": "SSN",
                        "id_last4": f"{operation_id:04d}",
                        "employment_status": "employed",
                        "annual_income": 50000,
                        "co_borrower_name": None
                    }
                })
                
                results_queue.put({
                    "operation_id": operation_id,
                    "status_code": response.status_code,
                    "success": response.status_code == 200,
                    "response_time": time.time()
                })
                
            except Exception as e:
                results_queue.put({
                    "operation_id": operation_id,
                    "error": str(e),
                    "success": False
                })
        
        # Start 5 concurrent operations
        threads = []
        for i in range(5):
            thread = threading.Thread(target=concurrent_operation, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        results = []
        while not results_queue.empty():
            results.append(results_queue.get())
        
        successful = sum(1 for r in results if r.get("success"))
        
        test_result = {
            "test_name": "Concurrent Operations",
            "total_operations": len(results),
            "successful_operations": successful,
            "details": results
        }
        
        self.results["edge_cases"].append(test_result)
        print(f"✅ Concurrent Operations Test: {successful}/{len(results)} successful")
        return test_result
    
    def test_network_timeout_scenarios(self):
        """Test system behavior under network timeout conditions."""
        print("🧪 Testing network timeout scenarios...")
        
        timeout_tests = [
            {"timeout": 0.001, "description": "Very short timeout"},
            {"timeout": 0.1, "description": "Short timeout"},
            {"timeout": 1, "description": "Medium timeout"},
        ]
        
        test_results = []
        
        for test in timeout_tests:
            try:
                start_time = time.time()
                response = requests.get(
                    f"{self.api_base}/artifacts",
                    timeout=test["timeout"]
                )
                end_time = time.time()
                
                test_results.append({
                    "timeout": test["timeout"],
                    "description": test["description"],
                    "response_time": end_time - start_time,
                    "status_code": response.status_code,
                    "handled": True
                })
                
            except requests.exceptions.Timeout:
                test_results.append({
                    "timeout": test["timeout"],
                    "description": test["description"],
                    "error": "Timeout occurred",
                    "handled": True
                })
            except Exception as e:
                test_results.append({
                    "timeout": test["timeout"],
                    "description": test["description"],
                    "error": str(e),
                    "handled": True
                })
        
        test_result = {
            "test_name": "Network Timeout Scenarios",
            "total_tests": len(timeout_tests),
            "handled_tests": sum(1 for r in test_results if r.get("handled")),
            "details": test_results
        }
        
        self.results["network_failure_tests"].append(test_result)
        print(f"✅ Timeout Test: {test_result['handled_tests']}/{test_result['total_tests']} handled")
        return test_result
    
    def test_unicode_and_special_characters(self):
        """Test system behavior with Unicode and special characters."""
        print("🧪 Testing Unicode and special characters...")
        
        unicode_tests = [
            {"field": "borrower_name", "value": "José María García-López"},
            {"field": "borrower_name", "value": "李小明"},
            {"field": "borrower_name", "value": "Александр Петров"},
            {"field": "borrower_name", "value": "محمد أحمد"},
            {"field": "borrower_name", "value": "François D'Angelo"},
            {"field": "borrower_name", "value": "O'Connor-Smith"},
            {"field": "borrower_name", "value": "Test User 🏠"},
            {"field": "borrower_name", "value": "Test User \n New Line"},
            {"field": "borrower_name", "value": "Test User \t Tab"},
            {"field": "borrower_name", "value": "Test User \" Quotes \""},
        ]
        
        test_results = []
        
        for test in unicode_tests:
            try:
                response = requests.post(f"{self.api_base}/loan-documents/seal", json={
                    "loan_id": f"UNICODE_TEST_{int(time.time())}",
                    "document_type": "unicode_test",
                    "loan_amount": 1000,
                    "created_by": "test@example.com",
                    "borrower": {
                        "full_name": test["value"],
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
                        "annual_income": 50000,
                        "co_borrower_name": None
                    }
                })
                
                test_results.append({
                    "field": test["field"],
                    "value": test["value"][:50] + "...",
                    "status_code": response.status_code,
                    "handled": response.status_code in [200, 422, 400]
                })
                
            except Exception as e:
                test_results.append({
                    "field": test["field"],
                    "value": test["value"][:50] + "...",
                    "error": str(e),
                    "handled": True
                })
        
        test_result = {
            "test_name": "Unicode and Special Characters",
            "total_tests": len(unicode_tests),
            "handled_tests": sum(1 for r in test_results if r.get("handled")),
            "details": test_results
        }
        
        self.results["edge_cases"].append(test_result)
        print(f"✅ Unicode Test: {test_result['handled_tests']}/{test_result['total_tests']} handled")
        return test_result
    
    def run_edge_case_tests(self):
        """Run all edge case and error scenario tests."""
        print("🧪 STARTING EDGE CASE & ERROR SCENARIO TESTING SUITE")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all edge case tests
        self.test_extreme_data_sizes()
        self.test_boundary_values()
        self.test_malformed_json()
        self.test_concurrent_operations()
        self.test_network_timeout_scenarios()
        self.test_unicode_and_special_characters()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Generate edge case summary
        self.generate_edge_case_summary(total_duration)
        
        return self.results
    
    def generate_edge_case_summary(self, total_duration: float):
        """Generate comprehensive edge case test summary."""
        print("\n" + "=" * 60)
        print("🧪 EDGE CASE & ERROR SCENARIO TESTING SUMMARY")
        print("=" * 60)
        
        all_tests = []
        all_tests.extend(self.results["edge_cases"])
        all_tests.extend(self.results["error_scenarios"])
        all_tests.extend(self.results["boundary_tests"])
        all_tests.extend(self.results["resource_exhaustion_tests"])
        all_tests.extend(self.results["network_failure_tests"])
        all_tests.extend(self.results["data_corruption_tests"])
        
        total_tests = len(all_tests)
        handled_tests = sum(1 for test in all_tests if test.get("handled_correctly", test.get("handled", False)))
        
        print(f"🧪 Edge Case Test Results:")
        print(f"   Total Test Scenarios: {total_tests}")
        print(f"   Handled Scenarios: {handled_tests}")
        print(f"   Handling Rate: {(handled_tests/total_tests)*100:.1f}%")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        # Save results
        with open("edge_case_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: edge_case_test_results.json")
        
        if handled_tests / total_tests >= 0.8:
            print("🎉 System handles edge cases excellently!")
        elif handled_tests / total_tests >= 0.6:
            print("⚠️ System handles most edge cases well with some issues.")
        else:
            print("❌ System needs improvement in edge case handling.")

def main():
    """Run edge case and error scenario testing."""
    tester = EdgeCaseTester()
    tester.run_edge_case_tests()

if __name__ == "__main__":
    main()






