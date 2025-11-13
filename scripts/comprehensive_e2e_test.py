#!/usr/bin/env python3
"""
Comprehensive End-to-End Testing Script for IntegrityX Platform

This script performs complete end-to-end testing:
1. 30 single file uploads (10 standard, 10 quantum-safe, 10 maximum security)
2. 30 multiple file uploads (10 standard, 10 quantum-safe, 10 maximum security)
3. 3 directory uploads with 10 files each + random files
4. Verification testing
5. Zero knowledge proof testing
6. Analytics verification

All files are realistic, diverse, and contain complete loan information.
"""

import os
import sys
import json
import time
import random
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dotenv import load_dotenv

# Add backend/src to path
script_dir = Path(__file__).parent
project_root = script_dir.parent
backend_src_dir = project_root / "backend" / "src"
sys.path.insert(0, str(backend_src_dir))

# Load environment
env_path = project_root / "backend" / ".env"
if not env_path.exists():
    env_path = project_root / ".env"
load_dotenv(env_path)

import requests
from faker import Faker

fake = Faker()

# API base URL
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")

# Test results storage
test_results = {
    "single_uploads": [],
    "multiple_uploads": [],
    "directory_uploads": [],
    "verifications": [],
    "zero_knowledge_proofs": [],
    "analytics": {}
}

def generate_realistic_loan_data(index: int, security_mode: str = "standard") -> Dict[str, Any]:
    """Generate realistic, diverse loan data with complete information."""
    
    # Generate diverse borrower names
    first_names = [
        "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
        "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
        "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa",
        "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley"
    ]
    
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
        "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
        "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King"
    ]
    
    # Generate unique borrower
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    full_name = f"{first_name} {last_name}"
    
    # Generate diverse loan types
    loan_types = [
        "Mortgage", "Personal Loan", "Auto Loan", "Business Loan", "Student Loan",
        "Home Equity", "Refinance", "Construction Loan", "Bridge Loan", "Credit Line"
    ]
    
    # Generate diverse property types
    property_types = [
        "Single Family", "Condo", "Townhouse", "Multi-Family", "Commercial",
        "Land", "Mobile Home", "Co-op", "Manufactured", "Investment Property"
    ]
    
    # Generate diverse employment types
    employment_types = [
        "Full-Time Employee", "Self-Employed", "Part-Time Employee", "Contractor",
        "Business Owner", "Retired", "Unemployed", "Student", "Freelancer", "Consultant"
    ]
    
    # Generate diverse income sources
    income_sources = [
        "Salary", "Business Income", "Rental Income", "Investment Income", "Retirement",
        "Social Security", "Alimony", "Child Support", "Other", "Commission"
    ]
    
    loan_id = f"LOAN_{security_mode.upper()}_{index:03d}_{int(time.time())}"
    
    # Generate realistic loan amounts (diverse ranges)
    loan_amounts = [
        50000, 75000, 100000, 125000, 150000, 200000, 250000, 300000, 350000, 400000,
        450000, 500000, 600000, 750000, 1000000, 1500000, 2000000, 5000000
    ]
    loan_amount = random.choice(loan_amounts)
    
    # Generate diverse interest rates
    interest_rates = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0]
    interest_rate = random.choice(interest_rates)
    
    # Generate diverse loan terms
    loan_terms = [15, 20, 25, 30, 10, 5, 7, 12]
    loan_term = random.choice(loan_terms)
    
    # Generate diverse credit scores
    credit_scores = [580, 620, 650, 680, 700, 720, 750, 780, 800, 820, 850]
    credit_score = random.choice(credit_scores)
    
    # Generate diverse down payments
    down_payment_percent = random.choice([5, 10, 15, 20, 25, 30, 35, 40, 50])
    down_payment = int(loan_amount * (down_payment_percent / 100))
    
    # Generate diverse annual incomes
    annual_incomes = [
        30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000,
        200000, 250000, 300000, 400000, 500000
    ]
    annual_income = random.choice(annual_incomes)
    
    # Generate diverse property addresses
    property_address = fake.address().replace('\n', ', ')
    
    # Generate diverse employment info
    employer_name = fake.company()
    job_title = fake.job()
    employment_type = random.choice(employment_types)
    years_employed = random.randint(1, 30)
    
    # Generate diverse bank accounts
    bank_name = fake.company() + " Bank"
    account_number = fake.bban()
    routing_number = fake.aba()
    
    # Generate diverse document types
    document_types = [
        "Mortgage Application", "Income Verification", "Tax Return", "Bank Statement",
        "Credit Report", "Property Appraisal", "Title Deed", "Insurance Policy",
        "Employment Letter", "Asset Statement", "Purchase Agreement", "W-2 Form"
    ]
    
    loan_data = {
        "loan_id": loan_id,
        "loan_type": random.choice(loan_types),
        "loan_amount": loan_amount,
        "interest_rate": interest_rate,
        "loan_term_years": loan_term,
        "property_type": random.choice(property_types),
        "property_address": property_address,
        "purchase_price": loan_amount + down_payment,
        "down_payment": down_payment,
        "loan_purpose": random.choice([
            "Home Purchase", "Refinance", "Debt Consolidation", "Home Improvement",
            "Business Expansion", "Education", "Vehicle Purchase", "Other"
        ]),
        "created_by": f"test_user_{index}@integrityx.com",
        "document_type": random.choice(document_types)
    }
    
    borrower_info = {
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "email": f"{first_name.lower()}.{last_name.lower()}{index}@example.com",
        "phone": fake.phone_number(),
        "date_of_birth": fake.date_of_birth(minimum_age=25, maximum_age=75).isoformat(),
        "ssn": f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(1000, 9999)}",
        "address": fake.address().replace('\n', ', '),
        "city": fake.city(),
        "state": fake.state_abbr(),
        "zip_code": fake.zipcode(),
        "annual_income": annual_income,
        "annual_income_range": float(annual_income),
        "employment_type": employment_type,
        "employer_name": employer_name,
        "job_title": job_title,
        "years_employed": years_employed,
        "credit_score": credit_score,
        "bank_name": bank_name,
        "account_number": account_number,
        "routing_number": routing_number,
        "marital_status": random.choice(["Single", "Married", "Divorced", "Widowed"]),
        "dependents": random.randint(0, 5),
        "income_source": random.choice(income_sources)
    }
    
    return {
        "loan_data": loan_data,
        "borrower_info": borrower_info,
        "security_mode": security_mode
    }

def create_realistic_json_file(loan_data: Dict[str, Any], output_path: Path) -> Dict[str, Any]:
    """Create a realistic JSON loan document file."""
    
    document = {
        "loan_information": loan_data["loan_data"],
        "borrower_information": loan_data["borrower_info"],
        "financial_summary": {
            "total_assets": loan_data["borrower_info"]["annual_income"] * random.uniform(2, 5),
            "total_liabilities": loan_data["loan_data"]["loan_amount"] * random.uniform(0.1, 0.3),
            "debt_to_income_ratio": round(
                (loan_data["loan_data"]["loan_amount"] / loan_data["borrower_info"]["annual_income"]) * 100, 2
            ),
            "monthly_payment": round(
                loan_data["loan_data"]["loan_amount"] * 
                (loan_data["loan_data"]["interest_rate"] / 100 / 12) / 
                (1 - (1 + loan_data["loan_data"]["interest_rate"] / 100 / 12) ** (-loan_data["loan_data"]["loan_term_years"] * 12)), 2
            )
        },
        "property_details": {
            "address": loan_data["loan_data"]["property_address"],
            "property_type": loan_data["loan_data"]["property_type"],
            "year_built": random.randint(1950, 2024),
            "square_feet": random.randint(800, 5000),
            "bedrooms": random.randint(1, 5),
            "bathrooms": random.randint(1, 4),
            "estimated_value": loan_data["loan_data"]["purchase_price"] * random.uniform(0.9, 1.2)
        },
        "verification_status": {
            "income_verified": random.choice([True, False]),
            "employment_verified": random.choice([True, False]),
            "assets_verified": random.choice([True, False]),
            "credit_checked": True,
            "appraisal_completed": random.choice([True, False])
        },
        "metadata": {
            "created_at": datetime.now().isoformat(),
            "document_version": "1.0",
            "processing_status": "submitted",
            "reviewer_notes": fake.text(max_nb_chars=200) if random.random() > 0.5 else ""
        }
    }
    
    # Write to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(document, f, indent=2)
    
    # Calculate hash
    with open(output_path, 'rb') as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()
    
    return {
        "file_path": str(output_path),
        "filename": output_path.name,
        "file_size": output_path.stat().st_size,
        "file_hash": file_hash,
        "document": document
    }

def upload_single_file(loan_data: Dict[str, Any], security_mode: str, index: int) -> Dict[str, Any]:
    """Upload a single file with specified security mode."""
    
    # Create temporary file
    temp_dir = project_root / "test_uploads" / security_mode
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_path = temp_dir / f"loan_{index:03d}.json"
    
    file_info = create_realistic_json_file(loan_data, file_path)
    
    # Prepare request based on security mode
    endpoint_map = {
        "standard": "/api/loan-documents/seal",
        "quantum_safe": "/api/loan-documents/seal-quantum-safe",
        "maximum_security": "/api/loan-documents/seal-maximum-security"
    }
    
    endpoint = endpoint_map.get(security_mode, endpoint_map["standard"])
    
    # Prepare request matching LoanDocumentSealRequest model
    borrower_info = loan_data["borrower_info"]
    request_data = {
        "loan_id": loan_data["loan_data"]["loan_id"],
        "document_type": loan_data["loan_data"]["document_type"],
        "loan_amount": loan_data["loan_data"]["loan_amount"],
        "additional_notes": loan_data["loan_data"].get("additional_notes", ""),
        "borrower": {
            "full_name": borrower_info["full_name"],
            "date_of_birth": borrower_info["date_of_birth"],
            "email": borrower_info["email"],
            "phone": borrower_info["phone"],
            "address": {
                "street": borrower_info["address"].split(',')[0] if ',' in borrower_info["address"] else borrower_info["address"],
                "city": borrower_info["city"],
                "state": borrower_info["state"],
                "zip_code": borrower_info["zip_code"],
                "country": "United States"
            },
            "ssn_last4": borrower_info["ssn"].split('-')[-1][-4:] if '-' in borrower_info["ssn"] else borrower_info["ssn"][-4:],
            "id_type": borrower_info.get("id_type", "Driver's License"),
            "id_last4": borrower_info.get("id_last4", "1234"),
            "employment_status": borrower_info["employment_type"],
            "annual_income": borrower_info["annual_income"],
            "co_borrower_name": borrower_info.get("co_borrower_name")
        },
        "created_by": loan_data["loan_data"]["created_by"]
    }
    
    try:
        response = requests.post(
            f"{API_BASE}{endpoint}",
            json=request_data,
            timeout=30
        )
        
        result = {
            "index": index,
            "security_mode": security_mode,
            "loan_id": loan_data["loan_data"]["loan_id"],
            "file_path": str(file_path),
            "file_hash": file_info["file_hash"],
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.status_code == 200 else {"error": response.text}
        }
        
        if response.status_code == 200:
            resp_data = response.json().get("data", {})
            result["artifact_id"] = resp_data.get("artifact_id")
            result["walacor_tx_id"] = resp_data.get("walacor_tx_id")
        
        return result
        
    except Exception as e:
        return {
            "index": index,
            "security_mode": security_mode,
            "loan_id": loan_data["loan_data"]["loan_id"],
            "file_path": str(file_path),
            "file_hash": file_info["file_hash"],
            "status_code": 0,
            "success": False,
            "error": str(e)
        }

def upload_multiple_files(loan_data: Dict[str, Any], security_mode: str, index: int, num_files: int = 3) -> Dict[str, Any]:
    """Upload multiple files as separate documents with specified security mode."""
    
    # For multiple files, we'll upload them as separate single-file uploads
    # but group them together in the results
    temp_dir = project_root / "test_uploads" / security_mode / f"packet_{index:03d}"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    files_info = []
    artifact_ids = []
    walacor_tx_ids = []
    
    for i in range(num_files):
        file_path = temp_dir / f"document_{i+1}.json"
        # Create slightly different data for each file in packet
        modified_loan_data = loan_data.copy()
        modified_loan_data["loan_data"]["loan_id"] = f"{loan_data['loan_data']['loan_id']}_DOC{i+1}"
        modified_loan_data["loan_data"]["document_type"] = f"Document {i+1} for {loan_data['loan_data']['loan_id']}"
        file_info = create_realistic_json_file(modified_loan_data, file_path)
        files_info.append(file_info)
        
        # Upload each file separately
        upload_result = upload_single_file(modified_loan_data, security_mode, index * 100 + i)
        if upload_result.get("success"):
            artifact_ids.append(upload_result.get("artifact_id"))
            walacor_tx_ids.append(upload_result.get("walacor_tx_id"))
    
    return {
        "index": index,
        "security_mode": security_mode,
        "loan_id": loan_data["loan_data"]["loan_id"],
        "num_files": num_files,
        "files": files_info,
        "artifact_ids": artifact_ids,
        "walacor_tx_ids": walacor_tx_ids,
        "success": len(artifact_ids) == num_files,
        "success_count": len(artifact_ids)
    }

def upload_directory(loan_data: Dict[str, Any], security_mode: str, index: int, num_files: int = 10) -> Dict[str, Any]:
    """Upload a directory with multiple files plus random files."""
    
    temp_dir = project_root / "test_uploads" / security_mode / f"directory_{index:03d}"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    files_info = []
    
    # Create 10 loan-related files
    for i in range(num_files):
        file_path = temp_dir / f"loan_document_{i+1}.json"
        modified_loan_data = loan_data.copy()
        modified_loan_data["loan_data"]["document_type"] = f"Loan Document {i+1}"
        file_info = create_realistic_json_file(modified_loan_data, file_path)
        files_info.append(file_info)
    
    # Create some random/unnecessary files to test filtering
    random_files = [
        ("temp_file.txt", "This is a temporary file"),
        (".DS_Store", "System file"),
        ("backup.json.bak", json.dumps({"backup": True})),
        ("notes.txt", "Random notes"),
        ("old_version.json", json.dumps({"old": True}))
    ]
    
    for filename, content in random_files:
        random_file_path = temp_dir / filename
        with open(random_file_path, 'w') as f:
            f.write(content)
    
    # Calculate directory hash using ObjectValidator approach
    # Sort files by name and hash them together
    sorted_files = sorted(files_info, key=lambda x: x["filename"])
    directory_hash_input = "".join([f["file_hash"] for f in sorted_files])
    directory_hash = hashlib.sha256(directory_hash_input.encode()).hexdigest()
    
    # Use directory upload endpoint
    endpoint = "/api/seal/directory"
    
    # Prepare request matching DirectorySealRequest model
    borrower_info = loan_data["borrower_info"]
    request_data = {
        "directory_name": f"loan_directory_{index:03d}",
        "directory_hash": directory_hash,
        "files": [
            {
                "filename": f["filename"],
                "file_hash": f["file_hash"],
                "file_size": f["file_size"]
            }
            for f in files_info
        ],
        "loan_data": {
            "loan_id": loan_data["loan_data"]["loan_id"],
            "document_type": loan_data["loan_data"]["document_type"],
            "loan_amount": loan_data["loan_data"]["loan_amount"],
            "additional_notes": loan_data["loan_data"].get("additional_notes", ""),
            "borrower": {
                "full_name": borrower_info["full_name"],
                "date_of_birth": borrower_info["date_of_birth"],
                "email": borrower_info["email"],
                "phone": borrower_info["phone"],
                "address": {
                    "street": borrower_info["address"].split(',')[0] if ',' in borrower_info["address"] else borrower_info["address"],
                    "city": borrower_info["city"],
                    "state": borrower_info["state"],
                    "zip_code": borrower_info["zip_code"],
                    "country": "United States"
                },
                "ssn_last4": borrower_info["ssn"].split('-')[-1][-4:] if '-' in borrower_info["ssn"] else borrower_info["ssn"][-4:],
                "id_type": borrower_info.get("id_type", "Driver's License"),
                "id_last4": borrower_info.get("id_last4", "1234"),
                "employment_status": borrower_info["employment_type"],
                "annual_income": borrower_info["annual_income"],
                "co_borrower_name": borrower_info.get("co_borrower_name")
            },
            "created_by": loan_data["loan_data"]["created_by"]
        }
    }
    
    try:
        response = requests.post(
            f"{API_BASE}{endpoint}",
            json=request_data,
            timeout=90
        )
        
        result = {
            "index": index,
            "security_mode": security_mode,
            "loan_id": loan_data["loan_data"]["loan_id"],
            "num_files": num_files,
            "files": files_info,
            "random_files": random_files,
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.status_code == 200 else {"error": response.text}
        }
        
        if response.status_code == 200:
            resp_data = response.json().get("data", {})
            result["container_id"] = resp_data.get("container_id")
            result["walacor_tx_id"] = resp_data.get("walacor_tx_id")
            result["child_ids"] = resp_data.get("child_ids", [])
        
        return result
        
    except Exception as e:
        return {
            "index": index,
            "security_mode": security_mode,
            "loan_id": loan_data["loan_data"]["loan_id"],
            "num_files": num_files,
            "files": files_info,
            "status_code": 0,
            "success": False,
            "error": str(e)
        }

def verify_document(hash_or_tx_id: str) -> Dict[str, Any]:
    """Verify a document by hash or transaction ID."""
    try:
        response = requests.post(
            f"{API_BASE}/api/verify-by-hash",
            json={"hash": hash_or_tx_id},
            timeout=30
        )
        
        return {
            "hash": hash_or_tx_id,
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.status_code == 200 else {"error": response.text}
        }
    except Exception as e:
        return {
            "hash": hash_or_tx_id,
            "status_code": 0,
            "success": False,
            "error": str(e)
        }

def test_zero_knowledge_proof(artifact_id: str, document_hash: str = None) -> Dict[str, Any]:
    """Test zero knowledge proof feature."""
    try:
        # First, get the artifact to get its hash if not provided
        if not document_hash:
            try:
                artifact_response = requests.get(
                    f"{API_BASE}/api/artifacts/{artifact_id}",
                    timeout=10
                )
                if artifact_response.status_code == 200:
                    artifact_data = artifact_response.json().get("data", {})
                    document_hash = artifact_data.get("hash") or artifact_data.get("payload_sha256", "default_hash")
            except:
                document_hash = "default_hash_for_testing"
        
        # Generate verification link (correct endpoint)
        generate_request = {
            "documentId": artifact_id,
            "documentHash": document_hash,
            "allowedParty": "test_verifier@integrityx.com",
            "permissions": ["hash", "timestamp", "attestations"],
            "expiresInHours": 24
        }
        
        response = requests.post(
            f"{API_BASE}/api/verification/generate-link",
            json=generate_request,
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                "artifact_id": artifact_id,
                "success": False,
                "error": f"Failed to generate link: {response.status_code} - {response.text[:200]}"
            }
        
        resp_data = response.json().get("data", {})
        verification_link = resp_data.get("verification_link", {})
        token = verification_link.get("token")
        
        if not token:
            return {
                "artifact_id": artifact_id,
                "success": False,
                "error": "Token not found in response"
            }
        
        # Verify with token (requires verifierEmail query parameter)
        verify_response = requests.get(
            f"{API_BASE}/api/verification/verify/{token}",
            params={"verifierEmail": "test_verifier@integrityx.com"},
            timeout=30
        )
        
        return {
            "artifact_id": artifact_id,
            "token": token,
            "status_code": verify_response.status_code,
            "success": verify_response.status_code == 200,
            "response": verify_response.json() if verify_response.status_code == 200 else {"error": verify_response.text[:200]}
        }
    except Exception as e:
        return {
            "artifact_id": artifact_id,
            "success": False,
            "error": str(e)
        }

def get_analytics() -> Dict[str, Any]:
    """Get analytics dashboard data."""
    try:
        response = requests.get(
            f"{API_BASE}/api/analytics/dashboard",
            timeout=30
        )
        
        return {
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "data": response.json() if response.status_code == 200 else {"error": response.text}
        }
    except Exception as e:
        return {
            "status_code": 0,
            "success": False,
            "error": str(e)
        }

def get_documents() -> Dict[str, Any]:
    """Get all documents from Documents page."""
    try:
        response = requests.get(
            f"{API_BASE}/api/artifacts",
            params={"limit": 200},
            timeout=30
        )
        
        if response.status_code == 200:
            try:
                data = response.json()
                return {
                    "status_code": response.status_code,
                    "success": True,
                    "data": data
                }
            except json.JSONDecodeError:
                return {
                    "status_code": response.status_code,
                    "success": False,
                    "error": "Invalid JSON response"
                }
        else:
            return {
                "status_code": response.status_code,
                "success": False,
                "error": response.text[:200] if response.text else "Unknown error"
            }
    except Exception as e:
        return {
            "status_code": 0,
            "success": False,
            "error": str(e)
        }

def check_backend_health() -> bool:
    """Check if backend is running and healthy."""
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
            return True
        else:
            print(f"⚠️  Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {API_BASE}")
        print("   Please ensure the backend is running (e.g., python start_server.py)")
        return False
    except Exception as e:
        print(f"❌ Error checking backend health: {e}")
        return False

def main():
    """Main testing function."""
    print("=" * 80)
    print("COMPREHENSIVE END-TO-END TESTING")
    print("=" * 80)
    print()
    print("This will create 100 realistic files and test all features:")
    print("  • 30 single file uploads (10 standard, 10 quantum-safe, 10 maximum security)")
    print("  • 30 multiple file uploads (10 standard, 10 quantum-safe, 10 maximum security)")
    print("  • 3 directory uploads (10 files each + random files)")
    print("  • Verification testing")
    print("  • Zero knowledge proof testing")
    print("  • Analytics verification")
    print()
    
    # Check backend health
    print("Checking backend health...")
    if not check_backend_health():
        print("\n⚠️  Backend is not available. Please start it before running tests.")
        print("Exiting...")
        return
    
    print()
    print("Starting tests in 3 seconds...")
    time.sleep(3)
    
    # Test 1: Single file uploads
    print("\n" + "=" * 80)
    print("TEST 1: Single File Uploads (30 files)")
    print("=" * 80)
    
    security_modes = ["standard", "quantum_safe", "maximum_security"]
    for mode in security_modes:
        print(f"\n📤 Uploading 10 {mode} files...")
        for i in range(10):
            loan_data = generate_realistic_loan_data(i + 1, mode)
            result = upload_single_file(loan_data, mode, i + 1)
            test_results["single_uploads"].append(result)
            
            if result["success"]:
                print(f"  ✅ {i+1}/10: {result['loan_id']} - TX: {result.get('walacor_tx_id', 'N/A')[:20]}...")
            else:
                print(f"  ❌ {i+1}/10: {result['loan_id']} - Error: {result.get('error', 'Unknown')}")
            
            time.sleep(0.5)  # Small delay between uploads
    
    # Test 2: Multiple file uploads
    print("\n" + "=" * 80)
    print("TEST 2: Multiple File Uploads (30 packets)")
    print("=" * 80)
    
    for mode in security_modes:
        print(f"\n📤 Uploading 10 {mode} packets...")
        for i in range(10):
            loan_data = generate_realistic_loan_data(i + 11, mode)
            num_files = random.randint(2, 4)
            result = upload_multiple_files(loan_data, mode, i + 1, num_files)
            test_results["multiple_uploads"].append(result)
            
            if result["success"]:
                print(f"  ✅ {i+1}/10: {result['loan_id']} ({num_files} files) - TX: {result.get('walacor_tx_id', 'N/A')[:20]}...")
            else:
                print(f"  ❌ {i+1}/10: {result['loan_id']} - Error: {result.get('error', 'Unknown')}")
            
            time.sleep(0.5)
    
    # Test 3: Directory uploads
    print("\n" + "=" * 80)
    print("TEST 3: Directory Uploads (3 directories)")
    print("=" * 80)
    
    for i in range(3):
        mode = random.choice(security_modes)
        loan_data = generate_realistic_loan_data(i + 21, mode)
        result = upload_directory(loan_data, mode, i + 1, 10)
        test_results["directory_uploads"].append(result)
        
        if result["success"]:
            print(f"  ✅ Directory {i+1}/3: {result['loan_id']} (10 files) - TX: {result.get('walacor_tx_id', 'N/A')[:20]}...")
        else:
            print(f"  ❌ Directory {i+1}/3: {result['loan_id']} - Error: {result.get('error', 'Unknown')}")
        
        time.sleep(1)
    
    # Test 4: Check Documents Page
    print("\n" + "=" * 80)
    print("TEST 4: Documents Page Structure")
    print("=" * 80)
    
    documents_result = get_documents()
    if documents_result["success"]:
        try:
            # Handle different response structures
            resp_data = documents_result.get("data", {})
            if isinstance(resp_data, dict):
                # Check for nested data structure
                if "data" in resp_data:
                    docs_data = resp_data.get("data", [])
                elif "artifacts" in resp_data:
                    docs_data = resp_data.get("artifacts", [])
                else:
                    # Try to find list in response
                    docs_data = [v for v in resp_data.values() if isinstance(v, list)]
                    docs_data = docs_data[0] if docs_data else []
            elif isinstance(resp_data, list):
                docs_data = resp_data
            else:
                docs_data = []
            
            # Ensure docs_data is a list of dicts
            if docs_data and len(docs_data) > 0:
                if not isinstance(docs_data[0], dict):
                    print(f"⚠️  Documents data is in unexpected format (first item: {type(docs_data[0])}), skipping detailed analysis")
                    docs_data = []
            
            print(f"✅ Found {len(docs_data)} documents in Documents page")
            
            # Analyze structure
            single_files = [d for d in docs_data if isinstance(d, dict) and d.get("artifact_container_type") == "file"]
            packets = [d for d in docs_data if isinstance(d, dict) and d.get("artifact_container_type") == "batch_container"]
            directories = [d for d in docs_data if isinstance(d, dict) and d.get("artifact_container_type") == "directory_container"]
            
            print(f"  • Single files: {len(single_files)}")
            print(f"  • Packets: {len(packets)}")
            print(f"  • Directories: {len(directories)}")
            
            test_results["documents_page"] = {
                "total": len(docs_data),
                "single_files": len(single_files),
                "packets": len(packets),
                "directories": len(directories)
            }
        except Exception as e:
            print(f"⚠️  Error analyzing documents structure: {e}")
            test_results["documents_page"] = {"error": str(e)}
    else:
        print(f"❌ Failed to get documents: {documents_result.get('error', 'Unknown error')}")
    
    # Test 5: Verification
    print("\n" + "=" * 80)
    print("TEST 5: Verification Testing (5-10 files)")
    print("=" * 80)
    
    # Get some hashes to verify
    hashes_to_verify = []
    for upload in test_results["single_uploads"][:5]:
        if upload.get("success") and upload.get("file_hash"):
            hashes_to_verify.append(upload["file_hash"])
    
    for upload in test_results["multiple_uploads"][:3]:
        if upload.get("success") and upload.get("files"):
            hashes_to_verify.extend([f["file_hash"] for f in upload["files"][:2]])
    
    hashes_to_verify = hashes_to_verify[:10]  # Limit to 10
    
    print(f"Verifying {len(hashes_to_verify)} documents...")
    for i, hash_val in enumerate(hashes_to_verify, 1):
        result = verify_document(hash_val)
        test_results["verifications"].append(result)
        
        if result["success"]:
            print(f"  ✅ {i}/{len(hashes_to_verify)}: Verified - {hash_val[:16]}...")
        else:
            print(f"  ❌ {i}/{len(hashes_to_verify)}: Failed - {hash_val[:16]}...")
        
        time.sleep(0.3)
    
    # Test 6: Zero Knowledge Proof
    print("\n" + "=" * 80)
    print("TEST 6: Zero Knowledge Proof Testing")
    print("=" * 80)
    
    # Get some artifact IDs with their hashes
    artifact_data = []
    for upload in test_results["single_uploads"][:5]:
        if upload.get("success") and upload.get("artifact_id"):
            artifact_data.append({
                "artifact_id": upload["artifact_id"],
                "hash": upload.get("file_hash") or upload.get("response", {}).get("data", {}).get("hash", "")
            })
    
    print(f"Testing zero knowledge proof for {len(artifact_data)} artifacts...")
    for i, art_data in enumerate(artifact_data, 1):
        result = test_zero_knowledge_proof(art_data["artifact_id"], art_data["hash"])
        test_results["zero_knowledge_proofs"].append(result)
        
        if result["success"]:
            print(f"  ✅ {i}/{len(artifact_data)}: ZKP verified for {art_data['artifact_id'][:20]}...")
        else:
            error_msg = result.get("error", "Unknown error")[:50]
            print(f"  ❌ {i}/{len(artifact_data)}: ZKP failed for {art_data['artifact_id'][:20]}... ({error_msg})")
        
        time.sleep(0.3)
    
    # Test 7: Analytics
    print("\n" + "=" * 80)
    print("TEST 7: Analytics Dashboard")
    print("=" * 80)
    
    analytics_result = get_analytics()
    if analytics_result["success"]:
        print("✅ Analytics data retrieved")
        
        # Handle nested response structure: 
        # analytics_result = {"data": response.json()}
        # response.json() = {"ok": true, "data": {"dashboard": {...}}}
        # So we need: analytics_result["data"]["data"]["dashboard"]
        resp_data = analytics_result.get("data", {})
        if isinstance(resp_data, dict) and "data" in resp_data:
            dashboard_data = resp_data.get("data", {}).get("dashboard", {})
        else:
            dashboard_data = {}
        
        print("\nAnalytics Summary:")
        
        # System metrics
        system_metrics = dashboard_data.get("system_metrics", {})
        system_overview = system_metrics.get("overview", {})
        print(f"  • System Status: {dashboard_data.get('status', 'operational')}")
        print(f"  • Timestamp: {dashboard_data.get('timestamp', 'N/A')}")
        print(f"  • Total Documents (System): {system_overview.get('total_documents', 0)}")
        print(f"  • Total Attestations: {system_overview.get('total_attestations', 0)}")
        print(f"  • Total Audit Events: {system_overview.get('total_audit_events', 0)}")
        
        # Document analytics
        doc_analytics = dashboard_data.get("document_analytics", {})
        if isinstance(doc_analytics, dict) and len(doc_analytics) > 0:
            if "error" in doc_analytics:
                print(f"  • Document Analytics Error: {doc_analytics.get('error', 'Unknown')}")
            elif "total_documents" in doc_analytics:
                print(f"  ✅ Total Documents (Analytics): {doc_analytics.get('total_documents', 'N/A')}")
                print(f"  ✅ Sealed Documents: {doc_analytics.get('sealed_documents', 'N/A')}")
                print(f"  ✅ Total Loans: {doc_analytics.get('total_loans', 'N/A')}")
                print(f"  ✅ Sealing Rate: {doc_analytics.get('sealing_rate', 'N/A')}%")
            else:
                print(f"  • Document Analytics: {list(doc_analytics.keys())}")
        else:
            print(f"  • Document Analytics: Not available (type: {type(doc_analytics)}, len: {len(doc_analytics) if isinstance(doc_analytics, dict) else 'N/A'})")
        
        # Performance analytics
        perf_analytics = dashboard_data.get("performance_analytics", {})
        if perf_analytics:
            print(f"  • AI Processing Stats: {perf_analytics.get('ai_processing', {})}")
            print(f"  • Average Processing Time: {perf_analytics.get('average_processing_time', 'N/A')}")
        else:
            perf_metrics = system_metrics.get("performance_metrics", {})
            if perf_metrics:
                print(f"  • Average Processing Time: {perf_metrics.get('average_processing_time', 'N/A')}")
                print(f"  • Error Rate: {perf_metrics.get('error_rate', 'N/A')}")
        
        test_results["analytics"] = {
            "dashboard": dashboard_data,
            "system_metrics": system_metrics,
            "document_analytics": doc_analytics,
            "performance_analytics": perf_analytics
        }
    else:
        print(f"❌ Failed to get analytics: {analytics_result.get('error', 'Unknown error')}")
    
    # Final Summary
    print("\n" + "=" * 80)
    print("TESTING SUMMARY")
    print("=" * 80)
    
    single_success = sum(1 for r in test_results["single_uploads"] if r.get("success"))
    multiple_success = sum(1 for r in test_results["multiple_uploads"] if r.get("success"))
    directory_success = sum(1 for r in test_results["directory_uploads"] if r.get("success"))
    verify_success = sum(1 for r in test_results["verifications"] if r.get("success"))
    zkp_success = sum(1 for r in test_results["zero_knowledge_proofs"] if r.get("success"))
    
    print(f"\nSingle File Uploads: {single_success}/30 successful")
    print(f"Multiple File Uploads: {multiple_success}/30 successful")
    print(f"Directory Uploads: {directory_success}/3 successful")
    print(f"Verifications: {verify_success}/{len(test_results['verifications'])} successful")
    print(f"Zero Knowledge Proofs: {zkp_success}/{len(test_results['zero_knowledge_proofs'])} successful")
    
    # Save results
    results_file = project_root / "test_results_e2e.json"
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2, default=str)
    
    print(f"\n✅ Test results saved to: {results_file}")
    print("\n🎉 End-to-end testing complete!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

