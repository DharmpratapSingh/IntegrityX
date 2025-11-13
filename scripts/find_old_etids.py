#!/usr/bin/env python
"""
Find Old ETId Configuration

This script helps identify which ETIds were used in the old configuration
by checking all available ETIds for loan-related data.
"""

import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

script_dir = Path(__file__).parent
project_root = script_dir.parent
backend_src_dir = project_root / "backend" / "src"
sys.path.insert(0, str(backend_src_dir))

env_path = project_root / "backend" / ".env"
load_dotenv(env_path)

host = os.getenv('WALACOR_HOST')
username = os.getenv('WALACOR_USERNAME')
password = os.getenv('WALACOR_PASSWORD')

base_url = f"http://{host}/api"

# Authenticate
auth_response = requests.post(
    f"{base_url}/auth/login",
    json={"userName": username, "password": password},
    headers={"Content-Type": "application/json"},
    timeout=10
)
auth_response.raise_for_status()
token = auth_response.json().get("api_token")

print("=" * 80)
print("FINDING OLD ETID CONFIGURATION")
print("=" * 80)
print()
print("This script checks all ETIds to find ones with loan-related data")
print("that might have been used in your old configuration.")
print()

# Get all schemas to check
try:
    from walacor_sdk import WalacorService
    wal = WalacorService(
        server=f"http://{host}/api",
        username=username,
        password=password
    )
    all_schemas = wal.schema.get_list_with_latest_version()
    print(f"Found {len(all_schemas)} schemas to check")
    print()
except Exception as e:
    print(f"Error getting schemas: {e}")
    sys.exit(1)

# Keywords to look for in loan-related data
loan_keywords = ['loan', 'borrower', 'mortgage', 'document_hash', 'audit', 'provenance', 
                 'attestation', 'financial', 'integrity', 'hash', 'seal']

potential_etids = []

print("Checking ETIds for loan-related data...")
print()

for schema in all_schemas:
    etid = schema.ETId
    # Skip system ETIds
    if etid < 10000 or etid in [50]:  # Skip schema registry
        continue
    
    try:
        # Check if schema has table
        detail = wal.schema.get_schema_details_with_ETId(etid)
        if not detail or not detail.DbTableName:
            continue  # Skip if no table
        
        # Try to query data
        url = f"{base_url}/query/get"
        headers = {
            "ETId": str(etid),
            "Authorization": token,
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json={}, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("data"):
                records = data["data"]
                if records:
                    # Check if any record contains loan-related keywords
                    for record in records:
                        record_str = json.dumps(record, default=str).lower()
                        if any(keyword in record_str for keyword in loan_keywords):
                            potential_etids.append({
                                'etid': etid,
                                'table_name': detail.TableName,
                                'family': detail.Family,
                                'record_count': len(records),
                                'sample_fields': list(records[0].keys())[:10]
                            })
                            break
    except:
        pass

print("=" * 80)
print("POTENTIAL OLD ETIDs (with loan-related data)")
print("=" * 80)
print()

if potential_etids:
    for item in potential_etids:
        print(f"ETId {item['etid']}:")
        print(f"  TableName: {item['table_name']}")
        print(f"  Family: {item['family']}")
        print(f"  Records: {item['record_count']}")
        print(f"  Fields: {', '.join(item['sample_fields'][:5])}...")
        print()
else:
    print("No ETIds found with loan-related data.")
    print()
    print("This could mean:")
    print("  1. The old configuration used ETIds 100001-100004 but tables don't exist")
    print("  2. The old configuration used different ETIds that we haven't checked")
    print("  3. The data was cleared or is in a different organization")
    print()

print("=" * 80)
print("RECOMMENDATION")
print("=" * 80)
print()
print("Since we can't find the old ETIds automatically:")
print("  1. Check your old code/config files for ETId references")
print("  2. Check Walacor UI LISTS page - filter by date to see old records")
print("  3. Check if you have any documentation about the old setup")
print("  4. If old config used 100001-100004, contact Walacor to create tables")
print("  5. OR use existing ETIds (10000, 10010, etc.) that have tables")
print()

