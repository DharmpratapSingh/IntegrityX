#!/usr/bin/env python3
"""
Performance & Benchmark Testing Suite for IntegrityX Platform
Tests system performance, benchmarks, and optimization opportunities.
"""

import requests
import json
import time
import statistics
import psutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any
import sys
import os

class PerformanceBenchmarkTester:
    """Performance and benchmark testing for IntegrityX platform."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "response_time_benchmarks": [],
            "throughput_tests": [],
            "memory_usage_tests": [],
            "cpu_usage_tests": [],
            "database_performance_tests": [],
            "walacor_performance_tests": []
        }
    
    def benchmark_api_response_times(self):
        """Benchmark API response times for different endpoints."""
        print("📊 Benchmarking API response times...")
        
        endpoints = [
            {"path": "/health", "method": "GET", "expected_time": 0.1},
            {"path": "/artifacts", "method": "GET", "expected_time": 0.5},
            {"path": "/analytics/system-metrics", "method": "GET", "expected_time": 1.0},
            {"path": "/walacor/status", "method": "GET", "expected_time": 0.3},
            {"path": "/analytics/dashboard", "method": "GET", "expected_time": 1.5},
        ]
        
        benchmark_results = []
        
        for endpoint in endpoints:
            response_times = []
            successful_requests = 0
            total_requests = 10
            
            for i in range(total_requests):
                try:
                    start_time = time.time()
                    
                    if endpoint["method"] == "GET":
                        response = requests.get(f"{self.api_base}{endpoint['path']}", timeout=30)
                    else:
                        response = requests.post(f"{self.api_base}{endpoint['path']}", timeout=30)
                    
                    end_time = time.time()
                    response_time = end_time - start_time
                    
                    if response.status_code in [200, 401, 403]:  # Auth required is acceptable
                        response_times.append(response_time)
                        successful_requests += 1
                    
                except Exception as e:
                    print(f"   Error testing {endpoint['path']}: {e}")
            
            if response_times:
                avg_response_time = statistics.mean(response_times)
                min_response_time = min(response_times)
                max_response_time = max(response_times)
                std_deviation = statistics.stdev(response_times) if len(response_times) > 1 else 0
                
                benchmark_results.append({
                    "endpoint": endpoint["path"],
                    "method": endpoint["method"],
                    "total_requests": total_requests,
                    "successful_requests": successful_requests,
                    "success_rate": (successful_requests / total_requests) * 100,
                    "avg_response_time": avg_response_time,
                    "min_response_time": min_response_time,
                    "max_response_time": max_response_time,
                    "std_deviation": std_deviation,
                    "expected_time": endpoint["expected_time"],
                    "meets_expectation": avg_response_time <= endpoint["expected_time"]
                })
        
        test_result = {
            "test_name": "API Response Time Benchmarks",
            "total_endpoints": len(endpoints),
            "benchmark_results": benchmark_results,
            "overall_performance": "Good" if all(r.get("meets_expectation", False) for r in benchmark_results) else "Needs Optimization"
        }
        
        self.results["response_time_benchmarks"].append(test_result)
        
        # Print summary
        for result in benchmark_results:
            status = "✅" if result["meets_expectation"] else "⚠️"
            print(f"   {status} {result['endpoint']}: {result['avg_response_time']:.3f}s (expected: {result['expected_time']}s)")
        
        return test_result
    
    def test_throughput_under_load(self):
        """Test system throughput under different load levels."""
        print("📊 Testing throughput under load...")
        
        load_levels = [
            {"concurrent_users": 5, "requests_per_user": 10, "description": "Light Load"},
            {"concurrent_users": 10, "requests_per_user": 20, "description": "Medium Load"},
            {"concurrent_users": 20, "requests_per_user": 15, "description": "Heavy Load"},
        ]
        
        throughput_results = []
        
        for load in load_levels:
            print(f"   Testing {load['description']}: {load['concurrent_users']} users, {load['requests_per_user']} requests each")
            
            def make_requests(user_id):
                user_results = []
                for i in range(load['requests_per_user']):
                    try:
                        start_time = time.time()
                        response = requests.get(f"{self.api_base}/health", timeout=10)
                        end_time = time.time()
                        
                        user_results.append({
                            "request_id": i,
                            "response_time": end_time - start_time,
                            "status_code": response.status_code,
                            "success": response.status_code == 200
                        })
                    except Exception as e:
                        user_results.append({
                            "request_id": i,
                            "error": str(e),
                            "success": False
                        })
                return user_results
            
            # Run concurrent requests
            start_time = time.time()
            with ThreadPoolExecutor(max_workers=load['concurrent_users']) as executor:
                futures = [executor.submit(make_requests, i) for i in range(load['concurrent_users'])]
                all_results = []
                for future in as_completed(futures):
                    all_results.extend(future.result())
            end_time = time.time()
            
            # Calculate metrics
            total_requests = len(all_results)
            successful_requests = sum(1 for r in all_results if r.get("success"))
            total_duration = end_time - start_time
            requests_per_second = total_requests / total_duration if total_duration > 0 else 0
            
            response_times = [r.get("response_time", 0) for r in all_results if r.get("response_time")]
            avg_response_time = statistics.mean(response_times) if response_times else 0
            max_response_time = max(response_times) if response_times else 0
            
            throughput_results.append({
                "load_level": load["description"],
                "concurrent_users": load["concurrent_users"],
                "requests_per_user": load["requests_per_user"],
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "success_rate": (successful_requests / total_requests) * 100 if total_requests > 0 else 0,
                "total_duration": total_duration,
                "requests_per_second": requests_per_second,
                "avg_response_time": avg_response_time,
                "max_response_time": max_response_time
            })
        
        test_result = {
            "test_name": "Throughput Under Load",
            "load_levels_tested": len(load_levels),
            "throughput_results": throughput_results
        }
        
        self.results["throughput_tests"].append(test_result)
        
        # Print summary
        for result in throughput_results:
            print(f"   {result['load_level']}: {result['requests_per_second']:.1f} req/s, {result['success_rate']:.1f}% success")
        
        return test_result
    
    def test_memory_usage_under_load(self):
        """Test memory usage under sustained load."""
        print("📊 Testing memory usage under load...")
        
        # Get initial memory usage
        initial_memory = psutil.virtual_memory()
        initial_available = initial_memory.available
        
        def memory_intensive_operation():
            """Perform memory-intensive operations."""
            results = []
            for i in range(100):
                try:
                    # Make API calls that might use memory
                    response = requests.get(f"{self.api_base}/artifacts", timeout=10)
                    results.append({
                        "request_id": i,
                        "status_code": response.status_code,
                        "memory_usage": psutil.virtual_memory().used
                    })
                except Exception as e:
                    results.append({
                        "request_id": i,
                        "error": str(e)
                    })
            return results
        
        # Run memory-intensive operations
        start_time = time.time()
        memory_samples = []
        
        # Sample memory every 2 seconds for 20 seconds
        def sample_memory():
            for _ in range(10):
                memory = psutil.virtual_memory()
                memory_samples.append({
                    "timestamp": time.time(),
                    "used_memory": memory.used,
                    "available_memory": memory.available,
                    "memory_percent": memory.percent
                })
                time.sleep(2)
        
        # Start memory sampling in background
        memory_thread = threading.Thread(target=sample_memory)
        memory_thread.start()
        
        # Run intensive operations
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(memory_intensive_operation) for _ in range(3)]
            all_results = []
            for future in as_completed(futures):
                all_results.extend(future.result())
        
        memory_thread.join()
        end_time = time.time()
        
        # Get final memory usage
        final_memory = psutil.virtual_memory()
        final_available = final_memory.available
        
        # Calculate memory metrics
        if memory_samples:
            max_memory_usage = max(sample["memory_percent"] for sample in memory_samples)
            avg_memory_usage = statistics.mean(sample["memory_percent"] for sample in memory_samples)
            memory_increase = initial_available - final_available
        else:
            max_memory_usage = 0
            avg_memory_usage = 0
            memory_increase = 0
        
        test_result = {
            "test_name": "Memory Usage Under Load",
            "initial_memory_available": initial_available,
            "final_memory_available": final_available,
            "memory_increase": memory_increase,
            "max_memory_usage_percent": max_memory_usage,
            "avg_memory_usage_percent": avg_memory_usage,
            "memory_samples": len(memory_samples),
            "total_operations": len(all_results),
            "duration": end_time - start_time
        }
        
        self.results["memory_usage_tests"].append(test_result)
        print(f"✅ Memory Test: Max usage {max_memory_usage:.1f}%, Avg usage {avg_memory_usage:.1f}%")
        return test_result
    
    def test_database_performance_benchmarks(self):
        """Benchmark database performance with different query types."""
        print("📊 Benchmarking database performance...")
        
        db_operations = [
            {"operation": "list_artifacts", "endpoint": "/artifacts", "description": "List all artifacts"},
            {"operation": "get_analytics", "endpoint": "/analytics/system-metrics", "description": "Get system metrics"},
            {"operation": "get_dashboard", "endpoint": "/analytics/dashboard", "description": "Get dashboard data"},
        ]
        
        db_results = []
        
        for operation in db_operations:
            response_times = []
            successful_requests = 0
            total_requests = 5
            
            for i in range(total_requests):
                try:
                    start_time = time.time()
                    response = requests.get(f"{self.api_base}{operation['endpoint']}", timeout=30)
                    end_time = time.time()
                    
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    
                    if response.status_code in [200, 401, 403]:
                        successful_requests += 1
                    
                except Exception as e:
                    print(f"   Error in {operation['operation']}: {e}")
            
            if response_times:
                avg_response_time = statistics.mean(response_times)
                min_response_time = min(response_times)
                max_response_time = max(response_times)
                
                db_results.append({
                    "operation": operation["operation"],
                    "description": operation["description"],
                    "total_requests": total_requests,
                    "successful_requests": successful_requests,
                    "success_rate": (successful_requests / total_requests) * 100,
                    "avg_response_time": avg_response_time,
                    "min_response_time": min_response_time,
                    "max_response_time": max_response_time,
                    "performance_rating": "Excellent" if avg_response_time < 0.5 else "Good" if avg_response_time < 1.0 else "Needs Optimization"
                })
        
        test_result = {
            "test_name": "Database Performance Benchmarks",
            "total_operations": len(db_operations),
            "db_results": db_results
        }
        
        self.results["database_performance_tests"].append(test_result)
        
        # Print summary
        for result in db_results:
            rating = result["performance_rating"]
            print(f"   {rating}: {result['operation']} - {result['avg_response_time']:.3f}s avg")
        
        return test_result
    
    def test_walacor_performance_benchmarks(self):
        """Benchmark Walacor blockchain performance."""
        print("📊 Benchmarking Walacor performance...")
        
        walacor_operations = [
            {"operation": "status_check", "endpoint": "/walacor/status", "description": "Walacor status check"},
            {"operation": "schema_management", "endpoint": "/walacor/schemas", "description": "Schema management"},
        ]
        
        walacor_results = []
        
        for operation in walacor_operations:
            response_times = []
            successful_requests = 0
            total_requests = 5
            
            for i in range(total_requests):
                try:
                    start_time = time.time()
                    response = requests.get(f"{self.api_base}{operation['endpoint']}", timeout=30)
                    end_time = time.time()
                    
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    
                    if response.status_code == 200:
                        successful_requests += 1
                    
                except Exception as e:
                    print(f"   Error in {operation['operation']}: {e}")
            
            if response_times:
                avg_response_time = statistics.mean(response_times)
                min_response_time = min(response_times)
                max_response_time = max(response_times)
                
                walacor_results.append({
                    "operation": operation["operation"],
                    "description": operation["description"],
                    "total_requests": total_requests,
                    "successful_requests": successful_requests,
                    "success_rate": (successful_requests / total_requests) * 100,
                    "avg_response_time": avg_response_time,
                    "min_response_time": min_response_time,
                    "max_response_time": max_response_time,
                    "blockchain_performance": "Excellent" if avg_response_time < 0.5 else "Good" if avg_response_time < 1.0 else "Needs Optimization"
                })
        
        test_result = {
            "test_name": "Walacor Performance Benchmarks",
            "total_operations": len(walacor_operations),
            "walacor_results": walacor_results
        }
        
        self.results["walacor_performance_tests"].append(test_result)
        
        # Print summary
        for result in walacor_results:
            rating = result["blockchain_performance"]
            print(f"   {rating}: {result['operation']} - {result['avg_response_time']:.3f}s avg")
        
        return test_result
    
    def run_performance_benchmarks(self):
        """Run all performance and benchmark tests."""
        print("📊 STARTING PERFORMANCE & BENCHMARK TESTING SUITE")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all performance tests
        self.benchmark_api_response_times()
        self.test_throughput_under_load()
        self.test_memory_usage_under_load()
        self.test_database_performance_benchmarks()
        self.test_walacor_performance_benchmarks()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Generate performance summary
        self.generate_performance_summary(total_duration)
        
        return self.results
    
    def generate_performance_summary(self, total_duration: float):
        """Generate comprehensive performance test summary."""
        print("\n" + "=" * 60)
        print("📊 PERFORMANCE & BENCHMARK TESTING SUMMARY")
        print("=" * 60)
        
        all_tests = []
        all_tests.extend(self.results["response_time_benchmarks"])
        all_tests.extend(self.results["throughput_tests"])
        all_tests.extend(self.results["memory_usage_tests"])
        all_tests.extend(self.results["database_performance_tests"])
        all_tests.extend(self.results["walacor_performance_tests"])
        
        total_tests = len(all_tests)
        
        print(f"📊 Performance Test Results:")
        print(f"   Total Test Scenarios: {total_tests}")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        # Calculate performance scores
        performance_scores = []
        for test in all_tests:
            if "benchmark_results" in test:
                scores = [r.get("meets_expectation", False) for r in test["benchmark_results"]]
                performance_scores.extend(scores)
            elif "throughput_results" in test:
                for result in test["throughput_results"]:
                    if result.get("success_rate", 0) >= 90:
                        performance_scores.append(True)
                    else:
                        performance_scores.append(False)
        
        if performance_scores:
            performance_score = (sum(performance_scores) / len(performance_scores)) * 100
            print(f"   Overall Performance Score: {performance_score:.1f}%")
            
            if performance_score >= 90:
                print("🚀 EXCELLENT performance across all benchmarks!")
            elif performance_score >= 80:
                print("⚡ GOOD performance with minor optimization opportunities.")
            elif performance_score >= 70:
                print("⚠️ MODERATE performance - optimization recommended.")
            else:
                print("🐌 POOR performance - significant optimization required!")
        
        # Save results
        with open("performance_benchmark_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: performance_benchmark_results.json")

def main():
    """Run performance and benchmark testing."""
    tester = PerformanceBenchmarkTester()
    tester.run_performance_benchmarks()

if __name__ == "__main__":
    main()
