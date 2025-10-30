#!/usr/bin/env python3
"""
Advanced Load & Stress Testing Suite for IntegrityX Platform
Tests system behavior under high load, concurrent users, and stress conditions.
"""

import asyncio
import aiohttp
import time
import json
import random
import statistics
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Any
import sys
import os

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

class AdvancedLoadTester:
    """Advanced load testing for IntegrityX platform."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "load_tests": [],
            "stress_tests": [],
            "concurrent_tests": [],
            "memory_tests": [],
            "performance_tests": []
        }
    
    async def test_concurrent_document_sealing(self, num_concurrent: int = 10):
        """Test concurrent document sealing operations."""
        print(f"🧪 Testing {num_concurrent} concurrent document sealing operations...")
        
        async def seal_document(session, doc_id):
            doc_data = {
                "loan_id": f"LOAD_TEST_{doc_id}_{int(time.time())}",
                "document_type": "load_test_document",
                "loan_amount": random.uniform(10000, 500000),
                "additional_notes": f"Load test document {doc_id}",
                "created_by": f"load_test_user_{doc_id}@example.com",
                "borrower": {
                    "full_name": f"Load Test User {doc_id}",
                    "date_of_birth": "1990-01-01",
                    "email": f"loadtest{doc_id}@example.com",
                    "phone": f"555-{doc_id:04d}",
                    "address": {
                        "street": f"{doc_id} Test Street",
                        "city": "Test City",
                        "state": "TC",
                        "zip_code": f"{doc_id:05d}",
                        "country": "United States"
                    },
                    "ssn_last4": f"{doc_id:04d}",
                    "id_type": "SSN",
                    "id_last4": f"{doc_id:04d}",
                    "employment_status": "employed",
                    "annual_income": random.uniform(50000, 200000),
                    "co_borrower_name": None
                }
            }
            
            start_time = time.time()
            try:
                async with session.post(f"{self.api_base}/loan-documents/seal", json=doc_data) as response:
                    end_time = time.time()
                    response_time = end_time - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "success": True,
                            "response_time": response_time,
                            "artifact_id": data.get("data", {}).get("artifact_id"),
                            "status_code": response.status
                        }
                    else:
                        return {
                            "success": False,
                            "response_time": response_time,
                            "error": f"HTTP {response.status}",
                            "status_code": response.status
                        }
            except Exception as e:
                end_time = time.time()
                return {
                    "success": False,
                    "response_time": end_time - start_time,
                    "error": str(e),
                    "status_code": 0
                }
        
        # Run concurrent requests
        async with aiohttp.ClientSession() as session:
            tasks = [seal_document(session, i) for i in range(num_concurrent)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Analyze results
        successful = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
        failed = num_concurrent - successful
        response_times = [r.get("response_time", 0) for r in results if isinstance(r, dict)]
        
        avg_response_time = statistics.mean(response_times) if response_times else 0
        max_response_time = max(response_times) if response_times else 0
        min_response_time = min(response_times) if response_times else 0
        
        test_result = {
            "test_name": f"Concurrent Document Sealing ({num_concurrent} users)",
            "total_requests": num_concurrent,
            "successful_requests": successful,
            "failed_requests": failed,
            "success_rate": (successful / num_concurrent) * 100,
            "avg_response_time": avg_response_time,
            "max_response_time": max_response_time,
            "min_response_time": min_response_time,
            "timestamp": time.time()
        }
        
        self.results["concurrent_tests"].append(test_result)
        
        print(f"✅ Concurrent Test Results:")
        print(f"   Success Rate: {test_result['success_rate']:.1f}%")
        print(f"   Avg Response Time: {avg_response_time:.3f}s")
        print(f"   Max Response Time: {max_response_time:.3f}s")
        
        return test_result
    
    async def test_rapid_fire_requests(self, num_requests: int = 50, delay: float = 0.1):
        """Test rapid-fire API requests to test system stability."""
        print(f"🧪 Testing {num_requests} rapid-fire requests with {delay}s delay...")
        
        async def make_request(session, req_id):
            start_time = time.time()
            try:
                async with session.get(f"{self.api_base}/health") as response:
                    end_time = time.time()
                    return {
                        "request_id": req_id,
                        "success": response.status == 200,
                        "response_time": end_time - start_time,
                        "status_code": response.status
                    }
            except Exception as e:
                end_time = time.time()
                return {
                    "request_id": req_id,
                    "success": False,
                    "response_time": end_time - start_time,
                    "error": str(e)
                }
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for i in range(num_requests):
                tasks.append(make_request(session, i))
                if delay > 0:
                    await asyncio.sleep(delay)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Analyze results
        successful = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
        response_times = [r.get("response_time", 0) for r in results if isinstance(r, dict)]
        
        test_result = {
            "test_name": f"Rapid Fire Requests ({num_requests} requests)",
            "total_requests": num_requests,
            "successful_requests": successful,
            "success_rate": (successful / num_requests) * 100,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0,
            "timestamp": time.time()
        }
        
        self.results["load_tests"].append(test_result)
        return test_result
    
    async def test_memory_usage_under_load(self, duration_minutes: int = 5):
        """Test memory usage under sustained load."""
        print(f"🧪 Testing memory usage under {duration_minutes} minutes of load...")
        
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        request_count = 0
        
        async def continuous_requests(session):
            nonlocal request_count
            while time.time() < end_time:
                try:
                    async with session.get(f"{self.api_base}/artifacts") as response:
                        request_count += 1
                        if request_count % 10 == 0:
                            print(f"   Made {request_count} requests...")
                except Exception as e:
                    print(f"   Request error: {e}")
                
                await asyncio.sleep(0.5)  # 2 requests per second
        
        async with aiohttp.ClientSession() as session:
            await continuous_requests(session)
        
        test_result = {
            "test_name": f"Memory Usage Test ({duration_minutes} minutes)",
            "duration_minutes": duration_minutes,
            "total_requests": request_count,
            "requests_per_minute": request_count / duration_minutes,
            "timestamp": time.time()
        }
        
        self.results["memory_tests"].append(test_result)
        return test_result
    
    async def test_database_performance_under_load(self, num_operations: int = 100):
        """Test database performance under load."""
        print(f"🧪 Testing database performance with {num_operations} operations...")
        
        async def db_operation(session, op_id):
            start_time = time.time()
            try:
                # Test list artifacts (database-heavy operation)
                async with session.get(f"{self.api_base}/artifacts") as response:
                    end_time = time.time()
                    return {
                        "operation_id": op_id,
                        "success": response.status == 200,
                        "response_time": end_time - start_time,
                        "status_code": response.status
                    }
            except Exception as e:
                end_time = time.time()
                return {
                    "operation_id": op_id,
                    "success": False,
                    "response_time": end_time - start_time,
                    "error": str(e)
                }
        
        async with aiohttp.ClientSession() as session:
            tasks = [db_operation(session, i) for i in range(num_operations)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Analyze results
        successful = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
        response_times = [r.get("response_time", 0) for r in results if isinstance(r, dict)]
        
        test_result = {
            "test_name": f"Database Performance ({num_operations} operations)",
            "total_operations": num_operations,
            "successful_operations": successful,
            "success_rate": (successful / num_operations) * 100,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0,
            "timestamp": time.time()
        }
        
        self.results["performance_tests"].append(test_result)
        return test_result
    
    async def test_walacor_connection_under_load(self, num_connections: int = 20):
        """Test Walacor connection stability under load."""
        print(f"🧪 Testing Walacor connection with {num_connections} concurrent connections...")
        
        async def walacor_operation(session, conn_id):
            start_time = time.time()
            try:
                # Test Walacor service status
                async with session.get(f"{self.api_base}/walacor/status") as response:
                    end_time = time.time()
                    return {
                        "connection_id": conn_id,
                        "success": response.status == 200,
                        "response_time": end_time - start_time,
                        "status_code": response.status
                    }
            except Exception as e:
                end_time = time.time()
                return {
                    "connection_id": conn_id,
                    "success": False,
                    "response_time": end_time - start_time,
                    "error": str(e)
                }
        
        async with aiohttp.ClientSession() as session:
            tasks = [walacor_operation(session, i) for i in range(num_connections)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Analyze results
        successful = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
        response_times = [r.get("response_time", 0) for r in results if isinstance(r, dict)]
        
        test_result = {
            "test_name": f"Walacor Connection Load ({num_connections} connections)",
            "total_connections": num_connections,
            "successful_connections": successful,
            "success_rate": (successful / num_connections) * 100,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0,
            "timestamp": time.time()
        }
        
        self.results["stress_tests"].append(test_result)
        return test_result
    
    async def run_advanced_load_tests(self):
        """Run all advanced load tests."""
        print("🚀 STARTING ADVANCED LOAD TESTING SUITE")
        print("=" * 60)
        
        start_time = time.time()
        
        # Test 1: Concurrent Document Sealing
        await self.test_concurrent_document_sealing(10)
        await asyncio.sleep(2)
        
        # Test 2: Rapid Fire Requests
        await self.test_rapid_fire_requests(50, 0.1)
        await asyncio.sleep(2)
        
        # Test 3: Database Performance
        await self.test_database_performance_under_load(50)
        await asyncio.sleep(2)
        
        # Test 4: Walacor Connection Load
        await self.test_walacor_connection_under_load(15)
        await asyncio.sleep(2)
        
        # Test 5: Memory Usage (shorter duration for testing)
        await self.test_memory_usage_under_load(1)
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Generate summary
        self.generate_load_test_summary(total_duration)
        
        return self.results
    
    def generate_load_test_summary(self, total_duration: float):
        """Generate comprehensive load test summary."""
        print("\n" + "=" * 60)
        print("🎯 ADVANCED LOAD TESTING SUMMARY")
        print("=" * 60)
        
        all_tests = []
        all_tests.extend(self.results["load_tests"])
        all_tests.extend(self.results["stress_tests"])
        all_tests.extend(self.results["concurrent_tests"])
        all_tests.extend(self.results["memory_tests"])
        all_tests.extend(self.results["performance_tests"])
        
        total_tests = len(all_tests)
        successful_tests = sum(1 for test in all_tests if test.get("success_rate", 0) >= 80)
        
        print(f"📊 Load Test Results:")
        print(f"   Total Test Scenarios: {total_tests}")
        print(f"   Successful Scenarios: {successful_tests}")
        print(f"   Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        # Performance metrics
        all_response_times = []
        for test in all_tests:
            if "avg_response_time" in test:
                all_response_times.append(test["avg_response_time"])
        
        if all_response_times:
            print(f"\n📈 Performance Metrics:")
            print(f"   Average Response Time: {statistics.mean(all_response_times):.3f}s")
            print(f"   Max Response Time: {max(all_response_times):.3f}s")
            print(f"   Min Response Time: {min(all_response_times):.3f}s")
        
        # Save results
        with open("advanced_load_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: advanced_load_test_results.json")
        
        if successful_tests / total_tests >= 0.8:
            print("🎉 System performs excellently under load!")
        elif successful_tests / total_tests >= 0.6:
            print("⚠️ System performs well under load with some issues.")
        else:
            print("❌ System needs optimization for load handling.")

async def main():
    """Run advanced load testing."""
    tester = AdvancedLoadTester()
    await tester.run_advanced_load_tests()

if __name__ == "__main__":
    asyncio.run(main())






