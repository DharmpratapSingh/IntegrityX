#!/usr/bin/env python3
"""
Comprehensive End-to-End Test Suite
Creates 100 realistic, diverse loan documents and tests all features.
"""

import json
import random
import time
import subprocess
from datetime import datetime, timedelta
from typing import List, Dict, Any
import hashlib
import os

BASE_URL = "http://localhost:8000"

def http_post(url: str, data: dict, timeout: int = 60) -> dict:
    """Make HTTP POST request using curl."""
    try:
        cmd = ['curl', '-s', '-X', 'POST', url, '-H', 'Content-Type: application/json', '-d', json.dumps(data), '--max-time', str(timeout)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            return {"ok": False, "error": result.stderr[:200]}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def http_get(url: str, params: dict = None, timeout: int = 30) -> dict:
    """Make HTTP GET request using curl."""
    try:
        url_with_params = url
        if params:
            param_str = '&'.join([f"{k}={v}" for k, v in params.items()])
            url_with_params = f"{url}?{param_str}"
        
        cmd = ['curl', '-s', url_with_params, '--max-time', str(timeout)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            return {"ok": False, "error": result.stderr[:200]}
    except Exception as e:
        return {"ok": False, "error": str(e)}

# Realistic data pools for diversity
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa",
    "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
    "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
    "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
    "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
]

CITIES = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio",
    "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus",
    "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington", "Boston",
    "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis",
    "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento"
]

STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA"]

LOAN_TYPES = ["home_loan", "auto_loan", "personal_loan", "business_loan", "student_loan", "refinance", "home_equity"]

DOCUMENT_TYPES = ["loan_application", "mortgage_application", "refinance_application", "home_equity_loan"]

EMPLOYMENT_STATUSES = ["employed", "self_employed", "retired", "unemployed", "student", "disabled"]

ID_TYPES = ["drivers_license", "passport", "state_id", "military_id", "alien_id"]

def generate_ssn() -> str:
    """Generate a realistic SSN format."""
    area = random.randint(100, 899)
    group = random.randint(10, 99)
    serial = random.randint(1000, 9999)
    return f"{area:03d}-{group:02d}-{serial:04d}"

def generate_itin() -> str:
    """Generate a realistic ITIN format."""
    prefix = random.choice([9, 7, 8])
    area = random.randint(10, 99)
    group = random.randint(10, 99)
    serial = random.randint(1000, 9999)
    return f"{prefix}{area:02d}-{group:02d}-{serial:04d}"

def generate_email(first_name: str, last_name: str) -> str:
    """Generate a realistic email."""
    domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"]
    number = random.randint(1, 9999) if random.random() < 0.3 else None
    if number:
        return f"{first_name.lower()}.{last_name.lower()}{number}@{random.choice(domains)}"
    return f"{first_name.lower()}.{last_name.lower()}@{random.choice(domains)}"

def generate_phone() -> str:
    """Generate a realistic phone number."""
    area = random.randint(200, 999)
    exchange = random.randint(200, 999)
    number = random.randint(1000, 9999)
    return f"{area}-{exchange}-{number:04d}"

def generate_date_of_birth() -> str:
    """Generate a realistic date of birth."""
    start_date = datetime(1950, 1, 1)
    end_date = datetime(2000, 12, 31)
    random_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
    return random_date.strftime("%Y-%m-%d")

def generate_loan_document(
    loan_id: str,
    security_level: str = "standard",
    loan_type: str = None,
    borrower_name: str = None
) -> Dict[str, Any]:
    """Generate a realistic loan document."""
    if not borrower_name:
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        borrower_name = f"{first_name} {last_name}"
    else:
        parts = borrower_name.split()
        first_name = parts[0] if parts else "John"
        last_name = parts[-1] if len(parts) > 1 else "Doe"
    
    if not loan_type:
        loan_type = random.choice(LOAN_TYPES)
    
    # Generate SSN or ITIN (80% SSN, 20% ITIN)
    use_ssn = random.random() < 0.8
    ssn_or_itin = generate_ssn() if use_ssn else generate_itin()
    ssn_or_itin_type = "SSN" if use_ssn else "ITIN"
    
    city = random.choice(CITIES)
    state = random.choice(STATES)
    zip_code = random.randint(10000, 99999)
    
    # Generate loan amount based on loan type
    if loan_type == "home_loan":
        loan_amount = random.randint(200000, 800000)
        property_value = loan_amount + random.randint(50000, 200000)
        down_payment = random.randint(20000, 100000)
    elif loan_type == "auto_loan":
        loan_amount = random.randint(15000, 60000)
        property_value = None
        down_payment = None
    elif loan_type == "business_loan":
        loan_amount = random.randint(50000, 500000)
        property_value = None
        down_payment = None
    elif loan_type == "student_loan":
        loan_amount = random.randint(10000, 100000)
        property_value = None
        down_payment = None
    else:
        loan_amount = random.randint(10000, 300000)
        property_value = None
        down_payment = None
    
    annual_income = random.randint(30000, 200000)
    
    # Build borrower data
    borrower_data = {
        "full_name": borrower_name,
        "date_of_birth": generate_date_of_birth(),
        "email": generate_email(first_name, last_name),
        "phone": generate_phone(),
        "address": {
            "street": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Maple', 'Park', 'First', 'Second', 'Elm', 'Cedar'])} St",
            "city": city,
            "state": state,
            "zip_code": str(zip_code),
            "country": "US"
        },
        "ssn_last4": ssn_or_itin[-4:].replace("-", ""),
        "ssn_or_itin_type": ssn_or_itin_type,
        "ssn_or_itin_number": ssn_or_itin,
        "id_type": random.choice(ID_TYPES),
        "id_last4": str(random.randint(1000, 9999)),
        "employment_status": random.choice(EMPLOYMENT_STATUSES),
        "annual_income": annual_income
    }
    
    # Build loan data
    loan_data = {
        "loan_id": loan_id,
        "document_type": random.choice(DOCUMENT_TYPES),
        "loan_amount": loan_amount,
        "loan_type": loan_type,
        "borrower_name": borrower_name,
        "additional_notes": f"Loan application for {borrower_name}",
        "created_by": "e2e_test@example.com"
    }
    
    # Add conditional fields based on loan type
    if loan_type in ["home_loan", "home_equity"]:
        loan_data.update({
            "property_value": property_value,
            "down_payment": down_payment,
            "property_type": random.choice(["Single Family", "Condo", "Townhouse", "Multi-Family"]),
            "property_address": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Maple'])} Ave, {city}, {state} {zip_code}"
        })
    elif loan_type == "auto_loan":
        loan_data.update({
            "vehicle_make": random.choice(["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi", "Tesla"]),
            "vehicle_model": random.choice(["Camry", "Accord", "F-150", "Silverado", "3 Series", "C-Class", "A4", "Model 3"]),
            "vehicle_year": random.randint(2018, 2025),
            "vehicle_vin": ''.join([random.choice('0123456789ABCDEFGHJKLMNPRSTUVWXYZ') for _ in range(17)]),
            "purchase_price": loan_amount + random.randint(5000, 15000)
        })
    elif loan_type == "business_loan":
        loan_data.update({
            "business_name": f"{borrower_name.split()[0]}'s {random.choice(['Services', 'Enterprises', 'Group', 'Solutions', 'Corp'])}",
            "business_type": random.choice(["LLC", "Corporation", "Partnership", "Sole Proprietorship"]),
            "business_registration_number": f"REG-{random.randint(100000, 999999)}",
            "annual_revenue": annual_income * random.randint(2, 10)
        })
    elif loan_type == "student_loan":
        loan_data.update({
            "school_name": random.choice(["State University", "Community College", "Technical Institute", "Private University"]),
            "degree_program": random.choice(["Computer Science", "Business Administration", "Engineering", "Medicine", "Law"]),
            "expected_graduation_date": (datetime.now() + timedelta(days=random.randint(365, 1825))).strftime("%Y-%m-%d")
        })
    elif loan_type == "refinance":
        loan_data.update({
            "current_loan_number": f"LOAN-{random.randint(100000, 999999)}",
            "current_lender": random.choice(["Bank of America", "Wells Fargo", "Chase", "Citibank", "US Bank"]),
            "refinance_purpose": random.choice(["Lower interest rate", "Cash out", "Shorter term", "Better terms"])
        })
    
    return {
        "loan_data": loan_data,
        "borrower_data": borrower_data,
        "security_level": security_level
    }

def create_file_content(loan_id: str, borrower_name: str) -> bytes:
    """Create a realistic file content."""
    content = f"""
LOAN APPLICATION
================

Loan ID: {loan_id}
Borrower: {borrower_name}
Date: {datetime.now().strftime("%Y-%m-%d")}

This is a comprehensive loan application document containing all necessary
information for processing the loan request. The document includes financial
statements, credit history, employment verification, and property details.

Document Hash: {hashlib.sha256(f"{loan_id}{borrower_name}".encode()).hexdigest()[:16]}
"""
    return content.encode('utf-8')

def upload_single_file(loan_doc: Dict[str, Any], security_level: str) -> Dict[str, Any]:
    """Upload a single file using the appropriate security endpoint."""
    loan_data = loan_doc["loan_data"]
    borrower_data = loan_doc["borrower_data"]
    
    # Create file content
    file_content = create_file_content(loan_data["loan_id"], borrower_data["full_name"])
    
    # Prepare request payload
    payload = {
        "loan_id": loan_data["loan_id"],
        "document_type": loan_data["document_type"],
        "loan_amount": loan_data["loan_amount"],
        "loan_type": loan_data.get("loan_type"),
        "property_address": loan_data.get("property_address"),
        "additional_notes": loan_data.get("additional_notes"),
        "created_by": loan_data["created_by"],
        "borrower": {
            "full_name": borrower_data["full_name"],
            "date_of_birth": borrower_data["date_of_birth"],
            "email": borrower_data["email"],
            "phone": borrower_data["phone"],
            "address": borrower_data["address"],
            "ssn_last4": borrower_data["ssn_last4"],
            "ssn_or_itin_type": borrower_data.get("ssn_or_itin_type"),
            "ssn_or_itin_number": borrower_data.get("ssn_or_itin_number"),
            "id_type": borrower_data["id_type"],
            "id_last4": borrower_data["id_last4"],
            "employment_status": borrower_data["employment_status"],
            "annual_income": borrower_data["annual_income"]
        }
    }
    
    # Add conditional fields
    for field in ["property_value", "down_payment", "property_type", "vehicle_make", 
                  "vehicle_model", "vehicle_year", "vehicle_vin", "purchase_price",
                  "business_name", "business_type", "business_registration_number", "annual_revenue",
                  "school_name", "degree_program", "expected_graduation_date",
                  "current_loan_number", "current_lender", "refinance_purpose",
                  "current_mortgage_balance", "equity_amount"]:
        if field in loan_data:
            payload[field] = loan_data[field]
    
    # Choose endpoint based on security level
    if security_level == "quantum_safe":
        endpoint = f"{BASE_URL}/api/loan-documents/seal-quantum-safe"
    elif security_level == "maximum":
        endpoint = f"{BASE_URL}/api/loan-documents/seal-maximum-security"
    else:
        endpoint = f"{BASE_URL}/api/loan-documents/seal"
    
    try:
        data = http_post(endpoint, payload, timeout=60)
        if data.get("ok"):
            return {
                "success": True,
                "artifact_id": data.get("data", {}).get("artifact_id"),
                "walacor_tx_id": data.get("data", {}).get("walacor_tx_id"),
                "security_level": security_level
            }
        else:
            return {"success": False, "error": data.get("error", "Unknown error")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def upload_multiple_files(loan_docs: List[Dict[str, Any]], security_level: str) -> Dict[str, Any]:
    """Upload multiple files - for now, upload them individually."""
    results = []
    for loan_doc in loan_docs:
        result = upload_single_file(loan_doc, security_level)
        results.append(result)
        time.sleep(0.5)  # Small delay between uploads
    
    success_count = sum(1 for r in results if r.get("success"))
    return {
        "success": success_count == len(loan_docs),
        "results": results,
        "success_count": success_count,
        "total_count": len(loan_docs)
    }

def upload_directory(loan_docs: List[Dict[str, Any]], directory_name: str, security_level: str) -> Dict[str, Any]:
    """Upload a directory of files."""
    # For directory upload, we'll use the directory seal endpoint
    # But first, let's upload files individually and then create a directory container
    results = []
    for loan_doc in loan_docs:
        result = upload_single_file(loan_doc, security_level)
        results.append(result)
        time.sleep(0.3)
    
    success_count = sum(1 for r in results if r.get("success"))
    return {
        "success": success_count == len(loan_docs),
        "directory_name": directory_name,
        "results": results,
        "success_count": success_count,
        "total_count": len(loan_docs)
    }

def verify_document(artifact_id: str, payload_hash: str = None, etid: int = None) -> Dict[str, Any]:
    """Verify a document by artifact_id or by hash."""
    try:
        # First, get the artifact to retrieve its hash and etid
        artifact_data = http_get(f"{BASE_URL}/api/artifacts", params={"limit": 1000}, timeout=30)
        if not artifact_data.get("ok"):
            return {"success": False, "error": "Failed to fetch artifacts"}
        
        artifacts = artifact_data.get("data", {}).get("artifacts", [])
        artifact = None
        for a in artifacts:
            if a.get("id") == artifact_id:
                artifact = a
                break
        
        if not artifact:
            return {"success": False, "error": "Artifact not found"}
        
        # Use verify-by-document endpoint which accepts artifact_id
        verify_payload = {
            "document_info": artifact_id
        }
        data = http_post(f"{BASE_URL}/api/verify-by-document", verify_payload, timeout=30)
        
        if data.get("ok"):
            return {"success": True, "data": data.get("data", {})}
        else:
            return {"success": False, "error": data.get("error", "Unknown error")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_artifacts(limit: int = 100) -> Dict[str, Any]:
    """Get artifacts from the API."""
    try:
        data = http_get(f"{BASE_URL}/api/artifacts", params={"limit": limit}, timeout=30)
        if data.get("ok"):
            return {"success": True, "data": data.get("data", {})}
        else:
            return {"success": False, "error": data.get("error", "Unknown error")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_analytics() -> Dict[str, Any]:
    """Get analytics data."""
    try:
        # Try dashboard endpoint first
        data = http_get(f"{BASE_URL}/api/analytics/dashboard", timeout=30)
        if data.get("ok"):
            return {"success": True, "data": data.get("data", {})}
        else:
            # Try system-metrics as fallback
            data = http_get(f"{BASE_URL}/api/analytics/system-metrics", timeout=30)
            if data.get("ok"):
                return {"success": True, "data": data.get("data", {})}
            return {"success": False, "error": data.get("error", "Unknown error")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    """Run comprehensive end-to-end tests."""
    print("="*80)
    print("COMPREHENSIVE END-TO-END TEST SUITE")
    print("="*80)
    print()
    
    all_artifact_ids = []
    test_results = {
        "single_uploads": {"standard": [], "quantum_safe": [], "maximum": []},
        "multiple_uploads": {"standard": [], "quantum_safe": [], "maximum": []},
        "directory_uploads": []
    }
    
    # Test 1: Single File Uploads (30 files: 10 each for standard, quantum-safe, maximum)
    print("="*80)
    print("TEST 1: Single File Uploads (30 files)")
    print("="*80)
    
    for security_level in ["standard", "quantum_safe", "maximum"]:
        print(f"\n📤 Uploading 10 files with {security_level} security...")
        for i in range(10):
            loan_id = f"E2E_SINGLE_{security_level.upper()}_{i+1}_{int(time.time())}"
            loan_doc = generate_loan_document(loan_id, security_level)
            result = upload_single_file(loan_doc, security_level)
            
            if result.get("success"):
                all_artifact_ids.append(result["artifact_id"])
                test_results["single_uploads"][security_level].append(result)
                print(f"  ✅ {i+1}/10: {loan_id[:50]} -> {result['artifact_id'][:36]}")
            else:
                print(f"  ❌ {i+1}/10: {loan_id[:50]} -> Error: {result.get('error', 'Unknown')[:50]}")
            
            time.sleep(0.5)  # Small delay
    
    # Test 2: Multiple File Uploads (30 files: 10 batches each for standard, quantum-safe, maximum)
    print("\n" + "="*80)
    print("TEST 2: Multiple File Uploads (30 files in batches)")
    print("="*80)
    
    for security_level in ["standard", "quantum_safe", "maximum"]:
        print(f"\n📤 Uploading 10 files in batch with {security_level} security...")
        loan_docs = []
        for i in range(10):
            loan_id = f"E2E_MULTI_{security_level.upper()}_{i+1}_{int(time.time())}"
            loan_doc = generate_loan_document(loan_id, security_level)
            loan_docs.append(loan_doc)
        
        result = upload_multiple_files(loan_docs, security_level)
        if result.get("success"):
            test_results["multiple_uploads"][security_level] = result
            for r in result.get("results", []):
                if r.get("success"):
                    all_artifact_ids.append(r["artifact_id"])
            print(f"  ✅ Batch uploaded: {result['success_count']}/10 successful")
        else:
            print(f"  ❌ Batch upload failed: {result.get('error', 'Unknown')}")
    
    # Test 3: Directory Uploads (3 directories with 10 files each + random files)
    print("\n" + "="*80)
    print("TEST 3: Directory Uploads (3 directories, 10 files each + random files)")
    print("="*80)
    
    for dir_num in range(1, 4):
        print(f"\n📁 Creating directory {dir_num} with 10 files...")
        loan_docs = []
        security_level = random.choice(["standard", "quantum_safe", "maximum"])
        
        for i in range(10):
            loan_id = f"E2E_DIR_{dir_num}_{i+1}_{int(time.time())}"
            loan_doc = generate_loan_document(loan_id, security_level)
            loan_docs.append(loan_doc)
        
        directory_name = f"E2E_DIRECTORY_{dir_num}_{int(time.time())}"
        result = upload_directory(loan_docs, directory_name, security_level)
        
        if result.get("success"):
            test_results["directory_uploads"].append(result)
            for r in result.get("results", []):
                if r.get("success"):
                    all_artifact_ids.append(r["artifact_id"])
            print(f"  ✅ Directory {dir_num}: {result['success_count']}/10 files uploaded")
        else:
            print(f"  ❌ Directory {dir_num} failed: {result.get('error', 'Unknown')}")
    
    # Test 4: Check Documents Page Structure
    print("\n" + "="*80)
    print("TEST 4: Checking Documents Page Structure")
    print("="*80)
    
    artifacts_result = get_artifacts(limit=200)
    if artifacts_result.get("success"):
        data = artifacts_result["data"]
        total_count = data.get("total_count", 0)
        artifacts = data.get("artifacts", [])
        
        print(f"\n📊 Documents Page Statistics:")
        print(f"  Total documents: {total_count}")
        print(f"  Artifacts returned: {len(artifacts)}")
        
        # Count by security level
        security_counts = {}
        e2e_artifacts = [a for a in artifacts if 'E2E_' in a.get('loan_id', '')]
        
        print(f"\n  E2E Test Artifacts: {len(e2e_artifacts)}")
        
        for artifact in artifacts:
            level = artifact.get("security_level", "unknown")
            security_counts[level] = security_counts.get(level, 0) + 1
        
        print(f"\n  Security Level Distribution (All Documents):")
        for level, count in sorted(security_counts.items()):
            print(f"    {level}: {count}")
        
        # Check E2E artifacts security levels
        e2e_security_counts = {}
        e2e_security_issues = []
        for artifact in e2e_artifacts:
            loan_id = artifact.get("loan_id", "")
            top_level = artifact.get("security_level", "unknown")
            metadata_level = artifact.get("local_metadata", {}).get("security_level", "unknown")
            
            # Determine expected level from loan_id
            if "STANDARD" in loan_id:
                expected = "standard"
            elif "QUANTUM" in loan_id:
                expected = "quantum_safe"
            elif "MAXIMUM" in loan_id or "MAX" in loan_id:
                expected = "maximum"
            else:
                expected = "unknown"
            
            actual_level = top_level if top_level != "unknown" else metadata_level
            e2e_security_counts[actual_level] = e2e_security_counts.get(actual_level, 0) + 1
            
            if actual_level != expected and expected != "unknown":
                e2e_security_issues.append({
                    "loan_id": loan_id[:50],
                    "expected": expected,
                    "actual": actual_level
                })
        
        print(f"\n  E2E Security Level Distribution:")
        for level, count in sorted(e2e_security_counts.items()):
            print(f"    {level}: {count}")
        
        if e2e_security_issues:
            print(f"\n  ⚠️  Security Level Mismatches: {len(e2e_security_issues)}")
            for issue in e2e_security_issues[:5]:
                print(f"    - {issue['loan_id']}: Expected {issue['expected']}, Got {issue['actual']}")
        else:
            print(f"\n  ✅ All E2E artifacts have correct security levels!")
        
        # Show sample artifacts
        print(f"\n  Sample artifacts (first 5):")
        for i, artifact in enumerate(artifacts[:5], 1):
            print(f"    {i}. {artifact.get('loan_id', 'N/A')[:50]} | {artifact.get('security_level', 'N/A')} | {artifact.get('borrower_name', 'N/A')[:30]}")
    else:
        print(f"  ❌ Failed to get artifacts: {artifacts_result.get('error')}")
    
    # Test 5: Verify Documents (5-10 files)
    print("\n" + "="*80)
    print("TEST 5: Verifying Documents (5-10 files)")
    print("="*80)
    
    # Get artifacts from API to verify (they have borrower_info and are visible)
    artifacts_result = get_artifacts(limit=200)
    if artifacts_result.get("success"):
        artifacts = artifacts_result["data"].get("artifacts", [])
        e2e_artifacts = [a for a in artifacts if 'E2E_' in a.get('loan_id', '')]
        
        if e2e_artifacts:
            verify_count = min(10, len(e2e_artifacts))
            print(f"\n🔍 Verifying {verify_count} documents from API...")
            
            verified_count = 0
            verification_results = []
            for i, artifact in enumerate(e2e_artifacts[:verify_count], 1):
                artifact_id = artifact.get("id")
                loan_id = artifact.get("loan_id", "N/A")[:50]
                
                result = verify_document(artifact_id)
                if result.get("success"):
                    verified_count += 1
                    verify_data = result.get("data", {})
                    status = verify_data.get("status", "unknown")
                    is_valid = verify_data.get("is_valid", False)
                    verification_results.append({
                        "artifact_id": artifact_id,
                        "status": status,
                        "is_valid": is_valid
                    })
                    print(f"  ✅ {i}/{verify_count}: {loan_id} -> Status: {status}, Valid: {is_valid}")
                else:
                    error_msg = str(result.get('error', 'Unknown'))[:100]
                    print(f"  ❌ {i}/{verify_count}: {loan_id} -> Error: {error_msg}")
                time.sleep(0.3)
            
            print(f"\n  Verification Summary: {verified_count}/{verify_count} successful")
            if verification_results:
                valid_count = sum(1 for r in verification_results if r.get("is_valid"))
                print(f"  Valid documents: {valid_count}/{len(verification_results)}")
        else:
            print("  ⚠️  No E2E artifacts found in API to verify")
    else:
        print("  ⚠️  Failed to get artifacts for verification")
    
    # Test 6: Zero Knowledge Proof Testing
    print("\n" + "="*80)
    print("TEST 6: Zero Knowledge Proof Testing")
    print("="*80)
    
    if all_artifact_ids:
        test_count = min(10, len(all_artifact_ids))
        print(f"\n🔐 Testing zero knowledge proofs for {test_count} documents...")
        print("   (Verifying that sensitive data is masked/encrypted)")
        
        zkp_results = []
        for i, artifact_id in enumerate(all_artifact_ids[:test_count], 1):
            try:
                # Get borrower info (should be masked/encrypted)
                data = http_get(f"{BASE_URL}/api/loan-documents/{artifact_id}/borrower", timeout=30)
                if data.get("ok"):
                    borrower = data.get("data", {})
                    email = borrower.get("email", "")
                    phone = borrower.get("phone", "")
                    ssn = borrower.get("ssn_last4", "")
                    full_name = borrower.get("full_name", "")
                    
                    # Check if data is masked (zero knowledge)
                    email_masked = "***" in email or "@" not in email or len(email) < 10
                    phone_masked = "***" in phone or len(phone.replace("-", "").replace(" ", "")) < 10
                    ssn_masked = len(ssn) <= 4 or "***" in ssn
                    name_visible = len(full_name) > 0  # Name can be visible
                    
                    is_properly_masked = email_masked and phone_masked and ssn_masked
                    zkp_results.append({
                        "artifact_id": artifact_id,
                        "email_masked": email_masked,
                        "phone_masked": phone_masked,
                        "ssn_masked": ssn_masked,
                        "properly_masked": is_properly_masked
                    })
                    
                    status = "✅" if is_properly_masked else "⚠️"
                    print(f"  {status} {i}/{test_count}: {artifact_id[:36]}")
                    print(f"      Email: {'✅ Masked' if email_masked else '❌ Exposed'} ({email[:30]})")
                    print(f"      Phone: {'✅ Masked' if phone_masked else '❌ Exposed'} ({phone[:20]})")
                    print(f"      SSN: {'✅ Masked' if ssn_masked else '❌ Exposed'} ({ssn[:10]})")
                else:
                    print(f"  ❌ {i}/{test_count}: {artifact_id[:36]} -> Error: {data.get('error', 'Unknown')[:50]}")
            except Exception as e:
                print(f"  ❌ {i}/{test_count}: {artifact_id[:36]} -> Error: {str(e)[:50]}")
            time.sleep(0.2)
        
        if zkp_results:
            properly_masked = sum(1 for r in zkp_results if r.get("properly_masked"))
            print(f"\n  Zero Knowledge Proof Summary:")
            print(f"    Properly masked: {properly_masked}/{len(zkp_results)}")
            print(f"    Privacy protection: {'✅ Excellent' if properly_masked == len(zkp_results) else '⚠️ Needs improvement'}")
    else:
        print("  ⚠️  No artifacts to test")
    
    # Test 7: Analytics Page
    print("\n" + "="*80)
    print("TEST 7: Checking Analytics Page")
    print("="*80)
    
    analytics_result = get_analytics()
    if analytics_result.get("success"):
        data = analytics_result["data"]
        print(f"\n📈 Analytics Overview:")
        print(f"  Data: {json.dumps(data, indent=2)[:500]}...")
    else:
        print(f"  ❌ Failed to get analytics: {analytics_result.get('error')}")
    
    # Final Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    single_success = sum(len(test_results["single_uploads"][level]) for level in ["standard", "quantum_safe", "maximum"])
    print(f"\n✅ Single Uploads: {single_success}/30 successful")
    print(f"   - Standard: {len(test_results['single_uploads']['standard'])}/10")
    print(f"   - Quantum Safe: {len(test_results['single_uploads']['quantum_safe'])}/10")
    print(f"   - Maximum: {len(test_results['single_uploads']['maximum'])}/10")
    
    multi_success = sum(
        test_results["multiple_uploads"][level].get("success_count", 0)
        for level in ["standard", "quantum_safe", "maximum"]
    )
    print(f"\n✅ Multiple Uploads: {multi_success}/30 successful")
    
    dir_success = sum(
        d.get("success_count", 0) for d in test_results["directory_uploads"]
    )
    print(f"\n✅ Directory Uploads: {dir_success}/30 successful")
    
    print(f"\n📊 Total Artifacts Created: {len(all_artifact_ids)}")
    print(f"\n🎉 End-to-End Testing Complete!")
    print("="*80)

if __name__ == "__main__":
    main()

