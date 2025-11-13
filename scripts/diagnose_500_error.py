#!/usr/bin/env python
"""
Diagnose 500 Error from Walacor

This script performs comprehensive diagnostics to identify what triggers
the HTTP 500 error when inserting data into Walacor.
"""

import os
import sys
import json
import requests
from pathlib import Path
from datetime import datetime
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


def authenticate():
    """Authenticate and get token."""
    auth_response = requests.post(
        f"{base_url}/auth/login",
        json={"userName": username, "password": password},
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    auth_response.raise_for_status()
    return auth_response.json().get("api_token")


def test_insert_with_full_debug(etid, schema_name, test_data, sv=None):
    """Test insert with full debugging information."""
    print(f"\n{'='*80}")
    print(f"DIAGNOSTIC TEST: {schema_name} (ETId {etid})")
    if sv:
        print(f"Using SV={sv} in headers")
    print(f"{'='*80}")
    print()
    
    token = authenticate()
    url = f"{base_url}/envelopes/submit"
    
    # Build headers
    headers = {
        "ETId": str(etid),
        "Authorization": token,
        "Content-Type": "application/json"
    }
    if sv:
        headers["SV"] = str(sv)
    
    # Test different payload formats
    test_cases = [
        ("JSON string in Data array (SDK format)", {"Data": [json.dumps(test_data)]}),
        ("JSON object in Data array", {"Data": [test_data]}),
        ("Direct object (no Data wrapper)", test_data),
    ]
    
    for test_name, payload in test_cases:
        print(f"🧪 Test: {test_name}")
        print(f"   Headers: {dict((k, v if k != 'Authorization' else v[:20] + '...') for k, v in headers.items())}")
        print(f"   Payload structure: {type(payload).__name__}")
        if isinstance(payload, dict) and "Data" in payload:
            if isinstance(payload["Data"][0], str):
                print(f"   Data[0] type: string (length: {len(payload['Data'][0])})")
            else:
                print(f"   Data[0] type: object")
        print()
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                print(f"   ✅ SUCCESS!")
                print(f"   Response: {json.dumps(response.json(), indent=2)}")
                return True
            else:
                print(f"   ❌ FAILED")
                try:
                    error_json = response.json()
                    print(f"   Error Response: {json.dumps(error_json, indent=2)}")
                    
                    # Extract detailed error info
                    if "errors" in error_json:
                        for error in error_json.get("errors", []):
                            print(f"   Error Reason: {error.get('reason', 'N/A')}")
                            print(f"   Error Message: {error.get('message', 'N/A')}")
                except:
                    print(f"   Raw Response: {response.text[:500]}")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request Exception: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response Status: {e.response.status_code}")
                try:
                    print(f"   Response Body: {e.response.json()}")
                except:
                    print(f"   Response Text: {e.response.text[:500]}")
        except Exception as e:
            print(f"   ❌ Unexpected Error: {type(e).__name__}: {e}")
        
        print()
    
    return False


def check_schema_details(etid, sv=None):
    """Check schema details and see if we can query it."""
    print(f"\n{'='*80}")
    print(f"SCHEMA DETAILS CHECK: ETId {etid}")
    if sv:
        print(f"Checking SV={sv}")
    print(f"{'='*80}")
    print()
    
    try:
        from walacor_sdk import WalacorService
        wal = WalacorService(
            server=f"http://{host}/api",
            username=username,
            password=password
        )
        
        # Get schema details
        schema_detail = wal.schema.get_schema_details_with_ETId(etid)
        if schema_detail:
            print(f"✅ Schema found:")
            print(f"   ETId: {schema_detail.ETId}")
            print(f"   SV: {schema_detail.SV}")
            print(f"   TableName: {schema_detail.TableName}")
            print(f"   Family: {schema_detail.Family}")
            print(f"   IsDeleted: {schema_detail.IsDeleted}")
            print(f"   Fields: {len(schema_detail.Fields) if schema_detail.Fields else 0}")
            
            if schema_detail.Fields:
                print(f"   Field names:")
                for field in schema_detail.Fields:
                    required = "Required" if field.Required else "Optional"
                    print(f"     - {field.FieldName}: {field.DataType} ({required})")
            
            # Try to query existing data
            print()
            print("🔍 Attempting to query existing data...")
            try:
                result = wal.data_requests.get_all(ETId=etid, pageSize=1)
                if result:
                    print(f"   ✅ Query successful - found {len(result)} records")
                    if result:
                        print(f"   Sample record keys: {list(result[0].keys())}")
                else:
                    print(f"   ⚠️  Query returned None or empty")
            except Exception as e:
                print(f"   ❌ Query failed: {e}")
        else:
            print(f"❌ Schema not found")
            
    except Exception as e:
        print(f"❌ Error checking schema: {e}")


def main():
    print("=" * 80)
    print("WALACOR 500 ERROR DIAGNOSTIC")
    print("=" * 80)
    print()
    print("This script will perform comprehensive tests to identify")
    print("what triggers the HTTP 500 error when inserting data.")
    print()
    
    # Test 1: audit_logs with SV=1 fields
    print("\n" + "="*80)
    print("TEST 1: audit_logs (ETId 100004) - SV=1 full fields")
    print("="*80)
    check_schema_details(100004, sv=1)
    
    test_data_audit = {
        "document_id": f"DIAG-TEST-{int(datetime.now().timestamp())}",
        "event_type": "diagnostic_test",
        "user": "test_user",
        "timestamp": int(datetime.now().timestamp()),
        "ip_address": "127.0.0.1",
        "details": "Diagnostic test for 500 error"
    }
    test_insert_with_full_debug(100004, "audit_logs", test_data_audit, sv=1)
    
    # Test 2: Try with SV=3 minimal fields
    print("\n" + "="*80)
    print("TEST 2: audit_logs (ETId 100004) - SV=3 minimal fields")
    print("="*80)
    test_data_audit_minimal = {
        "document_id": f"DIAG-MIN-{int(datetime.now().timestamp())}",
        "event_type": "diagnostic_test",
        "timestamp": int(datetime.now().timestamp())
    }
    test_insert_with_full_debug(100004, "audit_logs (minimal)", test_data_audit_minimal, sv=3)
    
    # Test 3: Try without SV header (use default)
    print("\n" + "="*80)
    print("TEST 3: audit_logs (ETId 100004) - No SV header (use default)")
    print("="*80)
    test_insert_with_full_debug(100004, "audit_logs (default)", test_data_audit, sv=None)
    
    # Test 4: loan_documents
    print("\n" + "="*80)
    print("TEST 4: loan_documents (ETId 100001) - SV=1 full fields")
    print("="*80)
    check_schema_details(100001, sv=1)
    
    test_data_loan = {
        "loan_id": f"DIAG-LOAN-{int(datetime.now().timestamp())}",
        "document_type": "test",
        "document_hash": "a" * 64,
        "file_size": 1024,
        "upload_timestamp": int(datetime.now().timestamp()),
        "uploaded_by": "test_user",
        "file_path": "/test/path"
    }
    test_insert_with_full_debug(100001, "loan_documents", test_data_loan, sv=1)
    
    # Summary
    print("\n" + "="*80)
    print("DIAGNOSTIC SUMMARY")
    print("="*80)
    print()
    print("If all tests returned 500 errors:")
    print("  1. The schemas exist but are not activated for data insertion")
    print("  2. There may be a server-side validation issue")
    print("  3. Check Walacor server logs for detailed error information")
    print("  4. Verify schema activation status in Walacor UI")
    print()
    print("Next steps:")
    print("  - Check if any test succeeded (would indicate format issue)")
    print("  - Review error messages for specific field validation errors")
    print("  - Contact Walacor support with these diagnostic results")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

