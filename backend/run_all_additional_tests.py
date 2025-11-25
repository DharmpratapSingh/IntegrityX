#!/usr/bin/env python3
"""
Comprehensive Test Runner for All Additional IntegrityX Tests
Runs all advanced testing suites: Load, Security, Edge Cases, Integration, Performance
"""

import asyncio
import subprocess
import sys
import time
import json
from datetime import datetime
from typing import Dict, List, Any

class ComprehensiveTestRunner:
    """Runs all additional testing suites for IntegrityX platform."""
    
    def __init__(self):
        self.results = {
            "test_suites": [],
            "overall_summary": {},
            "start_time": None,
            "end_time": None
        }
    
    def run_test_suite(self, test_file: str, test_name: str) -> Dict[str, Any]:
        """Run a specific test suite and capture results."""
        print(f"\n🚀 Running {test_name}...")
        print("=" * 60)
        
        start_time = time.time()
        
        try:
            # Run the test file
            result = subprocess.run(
                [sys.executable, test_file],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout per test suite
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Parse results
            test_result = {
                "test_name": test_name,
                "test_file": test_file,
                "duration": duration,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0,
                "timestamp": datetime.now().isoformat()
            }
            
            # Try to load JSON results if available
            try:
                if "advanced_load_test_results.json" in result.stdout:
                    with open("advanced_load_test_results.json", "r") as f:
                        test_result["detailed_results"] = json.load(f)
            except:
                pass
            
            try:
                if "security_penetration_test_results.json" in result.stdout:
                    with open("security_penetration_test_results.json", "r") as f:
                        test_result["detailed_results"] = json.load(f)
            except:
                pass
            
            try:
                if "edge_case_test_results.json" in result.stdout:
                    with open("edge_case_test_results.json", "r") as f:
                        test_result["detailed_results"] = json.load(f)
            except:
                pass
            
            try:
                if "integration_e2e_test_results.json" in result.stdout:
                    with open("integration_e2e_test_results.json", "r") as f:
                        test_result["detailed_results"] = json.load(f)
            except:
                pass
            
            try:
                if "performance_benchmark_results.json" in result.stdout:
                    with open("performance_benchmark_results.json", "r") as f:
                        test_result["detailed_results"] = json.load(f)
            except:
                pass
            
            print(f"✅ {test_name} completed in {duration:.2f} seconds")
            if result.returncode != 0:
                print(f"⚠️ {test_name} had issues (return code: {result.returncode})")
                if result.stderr:
                    print(f"   Error: {result.stderr[:200]}...")
            
            return test_result
            
        except subprocess.TimeoutExpired:
            end_time = time.time()
            duration = end_time - start_time
            
            test_result = {
                "test_name": test_name,
                "test_file": test_file,
                "duration": duration,
                "return_code": -1,
                "stdout": "",
                "stderr": "Test timed out after 5 minutes",
                "success": False,
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"⏰ {test_name} timed out after {duration:.2f} seconds")
            return test_result
            
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            test_result = {
                "test_name": test_name,
                "test_file": test_file,
                "duration": duration,
                "return_code": -1,
                "stdout": "",
                "stderr": str(e),
                "success": False,
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"❌ {test_name} failed with error: {e}")
            return test_result
    
    def run_all_additional_tests(self):
        """Run all additional testing suites."""
        print("🎯 STARTING COMPREHENSIVE ADDITIONAL TESTING SUITE")
        print("=" * 80)
        print("This will run all advanced testing scenarios:")
        print("  • Advanced Load & Stress Testing")
        print("  • Security Penetration Testing")
        print("  • Edge Case & Error Scenario Testing")
        print("  • Integration & End-to-End Testing")
        print("  • Performance & Benchmark Testing")
        print("=" * 80)
        
        self.results["start_time"] = datetime.now().isoformat()
        
        # Define all test suites
        test_suites = [
            {
                "file": "advanced_load_testing.py",
                "name": "Advanced Load & Stress Testing",
                "description": "Tests system behavior under high load, concurrent users, and stress conditions"
            },
            {
                "file": "security_penetration_testing.py",
                "name": "Security Penetration Testing",
                "description": "Tests security vulnerabilities, injection attacks, and security boundaries"
            },
            {
                "file": "edge_case_testing.py",
                "name": "Edge Case & Error Scenario Testing",
                "description": "Tests system behavior under extreme conditions and error scenarios"
            },
            {
                "file": "integration_e2e_testing.py",
                "name": "Integration & End-to-End Testing",
                "description": "Tests complete user workflows and system integrations"
            },
            {
                "file": "performance_benchmark_testing.py",
                "name": "Performance & Benchmark Testing",
                "description": "Tests system performance, benchmarks, and optimization opportunities"
            }
        ]
        
        # Run each test suite
        for suite in test_suites:
            print(f"\n📋 {suite['name']}")
            print(f"   Description: {suite['description']}")
            
            result = self.run_test_suite(suite["file"], suite["name"])
            self.results["test_suites"].append(result)
            
            # Brief summary
            if result["success"]:
                print(f"   ✅ Status: PASSED")
            else:
                print(f"   ❌ Status: FAILED")
            print(f"   ⏱️  Duration: {result['duration']:.2f} seconds")
        
        self.results["end_time"] = datetime.now().isoformat()
        
        # Generate comprehensive summary
        self.generate_comprehensive_summary()
        
        return self.results
    
    def generate_comprehensive_summary(self):
        """Generate comprehensive summary of all test results."""
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE ADDITIONAL TESTING SUMMARY")
        print("=" * 80)
        
        total_suites = len(self.results["test_suites"])
        successful_suites = sum(1 for suite in self.results["test_suites"] if suite.get("success"))
        failed_suites = total_suites - successful_suites
        
        total_duration = sum(suite.get("duration", 0) for suite in self.results["test_suites"])
        
        print(f"📊 Overall Results:")
        print(f"   Total Test Suites: {total_suites}")
        print(f"   Successful Suites: {successful_suites}")
        print(f"   Failed Suites: {failed_suites}")
        print(f"   Success Rate: {(successful_suites/total_suites)*100:.1f}%")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        print(f"\n📋 Individual Test Suite Results:")
        for suite in self.results["test_suites"]:
            status = "✅ PASSED" if suite.get("success") else "❌ FAILED"
            duration = suite.get("duration", 0)
            print(f"   {status} {suite['test_name']} ({duration:.2f}s)")
        
        # Calculate overall performance score
        performance_indicators = []
        for suite in self.results["test_suites"]:
            if suite.get("success"):
                performance_indicators.append(100)
            else:
                performance_indicators.append(0)
        
        if performance_indicators:
            overall_score = sum(performance_indicators) / len(performance_indicators)
            print(f"\n🎯 Overall Performance Score: {overall_score:.1f}%")
            
            if overall_score >= 90:
                print("🎉 EXCELLENT! All additional testing scenarios passed!")
            elif overall_score >= 80:
                print("✅ GOOD! Most additional testing scenarios passed with minor issues.")
            elif overall_score >= 70:
                print("⚠️ MODERATE! Some additional testing scenarios need attention.")
            else:
                print("❌ NEEDS IMPROVEMENT! Multiple additional testing scenarios failed.")
        
        # Save comprehensive results
        with open("comprehensive_additional_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Comprehensive results saved to: comprehensive_additional_test_results.json")
        
        # Generate recommendations
        self.generate_recommendations()
    
    def generate_recommendations(self):
        """Generate recommendations based on test results."""
        print(f"\n💡 RECOMMENDATIONS:")
        
        failed_suites = [suite for suite in self.results["test_suites"] if not suite.get("success")]
        
        if not failed_suites:
            print("   🎉 All test suites passed! The system is performing excellently.")
            print("   📈 Consider running these tests regularly as part of CI/CD pipeline.")
            print("   🔍 Monitor performance metrics in production.")
        else:
            print("   🔧 Address the following issues:")
            for suite in failed_suites:
                print(f"      • {suite['test_name']}: {suite.get('stderr', 'Unknown error')[:100]}...")
            
            print("   📊 Review detailed results in individual JSON files.")
            print("   🚀 Re-run tests after fixes to verify improvements.")
        
        print("   📚 Use these tests for:")
        print("      • Pre-production validation")
        print("      • Performance benchmarking")
        print("      • Security assessment")
        print("      • Load testing before deployment")
        print("      • Regular system health checks")

def main():
    """Run all additional testing suites."""
    runner = ComprehensiveTestRunner()
    runner.run_all_additional_tests()

if __name__ == "__main__":
    main()






















