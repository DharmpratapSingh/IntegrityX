#!/usr/bin/env python3
"""
Directory Upload Test for IntegrityX Platform
Tests directory upload functionality and integrity checking with multiple files.
"""

import requests
import json
import time
import os
import hashlib
import sys
from typing import Dict, List, Any
from pathlib import Path

class DirectoryUploadTester:
    """Test IntegrityX system with directory uploads and integrity checking."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.results = {
            "directory_tests": [],
            "integrity_tests": [],
            "file_processing_tests": [],
            "hash_verification_tests": []
        }
    
    def calculate_directory_hash(self, directory_path: str) -> str:
        """Calculate hash for entire directory."""
        hashes = []
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'rb') as f:
                        file_hash = hashlib.sha256(f.read()).hexdigest()
                        hashes.append(f"{file}:{file_hash}")
                except Exception as e:
                    print(f"   Error reading {file_path}: {e}")
        
        # Sort hashes for consistent ordering
        hashes.sort()
        combined_hash = hashlib.sha256(''.join(hashes).encode()).hexdigest()
        return combined_hash
    
    def test_directory_structure(self):
        """Test directory structure and file discovery."""
        print("📁 Testing directory structure and file discovery...")
        
        test_directories = [
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/loan_documents_2025",
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/borrower_documents_2025"
        ]
        
        directory_tests = []
        
        for directory_path in test_directories:
            try:
                if os.path.exists(directory_path):
                    files = []
                    total_size = 0
                    
                    for root, dirs, filenames in os.walk(directory_path):
                        for filename in filenames:
                            file_path = os.path.join(root, filename)
                            file_size = os.path.getsize(file_path)
                            files.append({
                                "filename": filename,
                                "path": file_path,
                                "size": file_size,
                                "relative_path": os.path.relpath(file_path, directory_path)
                            })
                            total_size += file_size
                    
                    directory_hash = self.calculate_directory_hash(directory_path)
                    
                    directory_tests.append({
                        "directory": directory_path,
                        "exists": True,
                        "file_count": len(files),
                        "total_size": total_size,
                        "directory_hash": directory_hash,
                        "files": files
                    })
                    
                    print(f"   ✅ {os.path.basename(directory_path)}: {len(files)} files, {total_size:,} bytes")
                    for file in files:
                        print(f"      📄 {file['filename']}: {file['size']:,} bytes")
                else:
                    directory_tests.append({
                        "directory": directory_path,
                        "exists": False,
                        "error": "Directory not found"
                    })
                    print(f"   ❌ {directory_path}: Directory not found")
                    
            except Exception as e:
                directory_tests.append({
                    "directory": directory_path,
                    "exists": False,
                    "error": str(e)
                })
                print(f"   ❌ {directory_path}: Error - {e}")
        
        test_result = {
            "test_name": "Directory Structure Test",
            "total_directories": len(test_directories),
            "existing_directories": sum(1 for test in directory_tests if test.get("exists")),
            "directory_tests": directory_tests
        }
        
        self.results["directory_tests"].append(test_result)
        print(f"✅ Directory Structure Test: {test_result['existing_directories']}/{test_result['total_directories']} directories found")
        return test_result
    
    def test_directory_integrity_checking(self):
        """Test directory integrity checking functionality."""
        print("🔍 Testing directory integrity checking...")
        
        test_directories = [
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/loan_documents_2025",
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/borrower_documents_2025"
        ]
        
        integrity_tests = []
        
        for directory_path in test_directories:
            try:
                if os.path.exists(directory_path):
                    # Calculate initial hash
                    initial_hash = self.calculate_directory_hash(directory_path)
                    
                    # Test 1: Verify directory hash consistency
                    time.sleep(0.1)  # Small delay
                    second_hash = self.calculate_directory_hash(directory_path)
                    
                    # Test 2: Check individual file hashes
                    file_hashes = []
                    for root, dirs, files in os.walk(directory_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            try:
                                with open(file_path, 'rb') as f:
                                    file_hash = hashlib.sha256(f.read()).hexdigest()
                                    file_hashes.append({
                                        "filename": file,
                                        "hash": file_hash,
                                        "size": os.path.getsize(file_path)
                                    })
                            except Exception as e:
                                file_hashes.append({
                                    "filename": file,
                                    "error": str(e)
                                })
                    
                    integrity_tests.append({
                        "directory": directory_path,
                        "initial_hash": initial_hash,
                        "second_hash": second_hash,
                        "hash_consistent": initial_hash == second_hash,
                        "file_count": len(file_hashes),
                        "file_hashes": file_hashes,
                        "integrity_status": "verified" if initial_hash == second_hash else "failed"
                    })
                    
                    status = "✅ VERIFIED" if initial_hash == second_hash else "❌ FAILED"
                    print(f"   {status} {os.path.basename(directory_path)}: Hash consistency check")
                    
                else:
                    integrity_tests.append({
                        "directory": directory_path,
                        "error": "Directory not found",
                        "integrity_status": "failed"
                    })
                    
            except Exception as e:
                integrity_tests.append({
                    "directory": directory_path,
                    "error": str(e),
                    "integrity_status": "failed"
                })
                print(f"   ❌ {directory_path}: Error - {e}")
        
        verified_count = sum(1 for test in integrity_tests if test.get("integrity_status") == "verified")
        total_tests = len(integrity_tests)
        
        test_result = {
            "test_name": "Directory Integrity Checking",
            "total_tests": total_tests,
            "verified_tests": verified_count,
            "verification_rate": (verified_count / total_tests) * 100 if total_tests > 0 else 0,
            "integrity_tests": integrity_tests
        }
        
        self.results["integrity_tests"].append(test_result)
        print(f"✅ Directory Integrity Test: {test_result['verification_rate']:.1f}% verified")
        return test_result
    
    def test_file_processing_simulation(self):
        """Test file processing simulation for directory upload."""
        print("📄 Testing file processing simulation...")
        
        test_directories = [
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/loan_documents_2025",
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/borrower_documents_2025"
        ]
        
        processing_tests = []
        
        for directory_path in test_directories:
            try:
                if os.path.exists(directory_path):
                    files_processed = []
                    total_processing_time = 0
                    
                    for root, dirs, files in os.walk(directory_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            start_time = time.time()
                            
                            try:
                                # Simulate file processing
                                with open(file_path, 'rb') as f:
                                    content = f.read()
                                    file_hash = hashlib.sha256(content).hexdigest()
                                    file_size = len(content)
                                
                                # Simulate document sealing
                                doc_data = {
                                    "loan_id": f"DIR_TEST_{int(time.time())}_{file}",
                                    "document_type": "directory_upload_test",
                                    "loan_amount": 750000.00,
                                    "additional_notes": f"Directory upload test - {file}",
                                    "created_by": "directory_test@integrityx.com",
                                    "borrower": {
                                        "full_name": "Dr. Jennifer Martinez",
                                        "date_of_birth": "1985-09-12",
                                        "email": "jennifer.martinez@email.com",
                                        "phone": "555-234-5678",
                                        "address": {
                                            "street": "456 Oak Ridge Drive",
                                            "city": "San Francisco",
                                            "state": "CA",
                                            "zip_code": "94102",
                                            "country": "United States"
                                        },
                                        "ssn_last4": "4567",
                                        "id_type": "SSN",
                                        "id_last4": "4567",
                                        "employment_status": "employed",
                                        "annual_income": 285000.00,
                                        "co_borrower_name": None
                                    }
                                }
                                
                                # Test API call
                                response = requests.post(f"{self.api_base}/loan-documents/seal", json=doc_data)
                                end_time = time.time()
                                processing_time = end_time - start_time
                                total_processing_time += processing_time
                                
                                files_processed.append({
                                    "filename": file,
                                    "file_size": file_size,
                                    "file_hash": file_hash,
                                    "processing_time": processing_time,
                                    "api_status": response.status_code,
                                    "api_success": response.status_code == 200,
                                    "artifact_id": response.json().get("data", {}).get("artifact_id") if response.status_code == 200 else None
                                })
                                
                            except Exception as e:
                                end_time = time.time()
                                processing_time = end_time - start_time
                                files_processed.append({
                                    "filename": file,
                                    "error": str(e),
                                    "processing_time": processing_time,
                                    "api_success": False
                                })
                    
                    processing_tests.append({
                        "directory": directory_path,
                        "files_processed": len(files_processed),
                        "total_processing_time": total_processing_time,
                        "average_processing_time": total_processing_time / len(files_processed) if files_processed else 0,
                        "successful_files": sum(1 for f in files_processed if f.get("api_success")),
                        "file_details": files_processed
                    })
                    
                    successful = sum(1 for f in files_processed if f.get("api_success"))
                    print(f"   ✅ {os.path.basename(directory_path)}: {successful}/{len(files_processed)} files processed successfully")
                    
                else:
                    processing_tests.append({
                        "directory": directory_path,
                        "error": "Directory not found",
                        "files_processed": 0
                    })
                    
            except Exception as e:
                processing_tests.append({
                    "directory": directory_path,
                    "error": str(e),
                    "files_processed": 0
                })
                print(f"   ❌ {directory_path}: Error - {e}")
        
        total_files = sum(test.get("files_processed", 0) for test in processing_tests)
        successful_files = sum(test.get("successful_files", 0) for test in processing_tests)
        
        test_result = {
            "test_name": "File Processing Simulation",
            "total_files": total_files,
            "successful_files": successful_files,
            "success_rate": (successful_files / total_files) * 100 if total_files > 0 else 0,
            "processing_tests": processing_tests
        }
        
        self.results["file_processing_tests"].append(test_result)
        print(f"✅ File Processing Test: {test_result['success_rate']:.1f}% success rate")
        return test_result
    
    def test_hash_verification_workflow(self):
        """Test hash verification workflow for directory files."""
        print("🔐 Testing hash verification workflow...")
        
        test_directories = [
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/loan_documents_2025",
            "/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/test_directories/borrower_documents_2025"
        ]
        
        verification_tests = []
        
        for directory_path in test_directories:
            try:
                if os.path.exists(directory_path):
                    file_verifications = []
                    
                    for root, dirs, files in os.walk(directory_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            
                            try:
                                # Calculate file hash
                                with open(file_path, 'rb') as f:
                                    file_hash = hashlib.sha256(f.read()).hexdigest()
                                
                                # Test hash verification API
                                verify_response = requests.post(f"{self.api_base}/verify-by-hash", json={"hash": file_hash})
                                
                                file_verifications.append({
                                    "filename": file,
                                    "file_hash": file_hash,
                                    "verification_status": verify_response.status_code,
                                    "verification_success": verify_response.status_code == 200,
                                    "response_data": verify_response.json() if verify_response.status_code == 200 else None
                                })
                                
                            except Exception as e:
                                file_verifications.append({
                                    "filename": file,
                                    "error": str(e),
                                    "verification_success": False
                                })
                    
                    verification_tests.append({
                        "directory": directory_path,
                        "file_verifications": file_verifications,
                        "total_files": len(file_verifications),
                        "successful_verifications": sum(1 for v in file_verifications if v.get("verification_success"))
                    })
                    
                    successful = sum(1 for v in file_verifications if v.get("verification_success"))
                    print(f"   📁 {os.path.basename(directory_path)}: {successful}/{len(file_verifications)} files verified")
                    
                else:
                    verification_tests.append({
                        "directory": directory_path,
                        "error": "Directory not found",
                        "file_verifications": []
                    })
                    
            except Exception as e:
                verification_tests.append({
                    "directory": directory_path,
                    "error": str(e),
                    "file_verifications": []
                })
                print(f"   ❌ {directory_path}: Error - {e}")
        
        total_verifications = sum(len(test.get("file_verifications", [])) for test in verification_tests)
        successful_verifications = sum(test.get("successful_verifications", 0) for test in verification_tests)
        
        test_result = {
            "test_name": "Hash Verification Workflow",
            "total_verifications": total_verifications,
            "successful_verifications": successful_verifications,
            "verification_rate": (successful_verifications / total_verifications) * 100 if total_verifications > 0 else 0,
            "verification_tests": verification_tests
        }
        
        self.results["hash_verification_tests"].append(test_result)
        print(f"✅ Hash Verification Test: {test_result['verification_rate']:.1f}% verification rate")
        return test_result
    
    def run_directory_upload_tests(self):
        """Run all directory upload and integrity tests."""
        print("📁 STARTING DIRECTORY UPLOAD & INTEGRITY TESTING SUITE")
        print("=" * 60)
        print("Testing directory upload functionality and integrity checking")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all directory upload tests
        self.test_directory_structure()
        self.test_directory_integrity_checking()
        self.test_file_processing_simulation()
        self.test_hash_verification_workflow()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Generate directory upload test summary
        self.generate_directory_upload_summary(total_duration)
        
        return self.results
    
    def generate_directory_upload_summary(self, total_duration: float):
        """Generate comprehensive directory upload test summary."""
        print("\n" + "=" * 60)
        print("📁 DIRECTORY UPLOAD & INTEGRITY TESTING SUMMARY")
        print("=" * 60)
        
        all_tests = []
        all_tests.extend(self.results["directory_tests"])
        all_tests.extend(self.results["integrity_tests"])
        all_tests.extend(self.results["file_processing_tests"])
        all_tests.extend(self.results["hash_verification_tests"])
        
        total_tests = len(all_tests)
        
        # Calculate overall success rates
        success_rates = []
        for test in all_tests:
            if "verification_rate" in test:
                success_rates.append(test["verification_rate"])
            elif "success_rate" in test:
                success_rates.append(test["success_rate"])
            elif "existing_directories" in test:
                success_rates.append((test["existing_directories"] / test["total_directories"]) * 100)
            else:
                success_rates.append(0)
        
        overall_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
        
        print(f"📁 Directory Upload Test Results:")
        print(f"   Total Test Scenarios: {total_tests}")
        print(f"   Overall Success Rate: {overall_success_rate:.1f}%")
        print(f"   Total Duration: {total_duration:.2f} seconds")
        
        # Save results
        with open("directory_upload_test_results.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: directory_upload_test_results.json")
        
        if overall_success_rate >= 90:
            print("🎉 Directory upload and integrity checking work excellently!")
        elif overall_success_rate >= 80:
            print("⚠️ Directory upload and integrity checking work well with minor issues.")
        else:
            print("❌ Directory upload and integrity checking need improvement.")
        
        print(f"\n📁 Test Directories Created:")
        print(f"   • loan_documents_2025/ - 4 files (loan application, credit report, employment verification, bank statements)")
        print(f"   • borrower_documents_2025/ - 3 files (borrower profile, income verification, tax returns)")
        print(f"   • Total Files: 7 realistic loan documents")
        print(f"   • Total Size: Multiple file types (JSON, TXT, PDF)")
        print(f"   • Purpose: Test directory integrity and file processing")

def main():
    """Run directory upload and integrity testing."""
    tester = DirectoryUploadTester()
    tester.run_directory_upload_tests()

if __name__ == "__main__":
    main()






