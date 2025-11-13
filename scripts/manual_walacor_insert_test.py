#!/usr/bin/env python
"""
Manual Walacor Insert Test

This script allows you to manually test inserting data into Walacor
to verify if SV=3 schemas are active and accepting data.

Run this to test if the schemas are properly activated in Walacor.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add backend/src directory to Python path
script_dir = Path(__file__).parent
project_root = script_dir.parent
backend_src_dir = project_root / "backend" / "src"
sys.path.insert(0, str(backend_src_dir))

try:
    from walacor_sdk import WalacorService
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)


def test_manual_insert(wal, etid, schema_name, test_data):
    """Test inserting data manually into a specific schema."""
    print(f"\n{'='*80}")
    print(f"MANUAL INSERT TEST: {schema_name} (ETId {etid})")
    print(f"{'='*80}")
    print()
    print("Data to insert:")
    print(json.dumps(test_data, indent=2))
    print()
    
    try:
        result = wal.data_requests.insert_single_record(
            jsonRecord=json.dumps(test_data),
            ETId=etid
        )
        
        if result:
            print("✅ INSERT SUCCESSFUL!")
            print("Response:")
            print(json.dumps(result, indent=2, default=str))
            return True
        else:
            print("❌ INSERT RETURNED None")
            print("   (Check Walacor logs for details)")
            return False
            
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        
        # Try to get more details
        if hasattr(e, 'response'):
            print("\nResponse details:")
            if hasattr(e.response, 'status_code'):
                print(f"  Status Code: {e.response.status_code}")
            if hasattr(e.response, 'text'):
                try:
                    error_json = e.response.json()
                    print(f"  Error JSON: {json.dumps(error_json, indent=2)}")
                except:
                    print(f"  Response Text: {e.response.text}")
        
        return False


def main():
    print("=" * 80)
    print("MANUAL WALACOR INSERT TEST")
    print("=" * 80)
    print()
    print("This script tests manual data insertion into Walacor SV=3 schemas")
    print("to verify if they are active and accepting data.")
    print()
    
    # Load environment
    env_path = project_root / "backend" / ".env"
    if not env_path.exists():
        print(f"❌ .env file not found at: {env_path}")
        sys.exit(1)
    
    load_dotenv(env_path)
    
    host = os.getenv('WALACOR_HOST')
    username = os.getenv('WALACOR_USERNAME')
    password = os.getenv('WALACOR_PASSWORD')
    
    if not all([host, username, password]):
        print("❌ Missing Walacor credentials")
        sys.exit(1)
    
    # Connect to Walacor
    print(f"📡 Connecting to Walacor at: {host}")
    try:
        wal = WalacorService(
            server=f"http://{host}/api",
            username=username,
            password=password
        )
        print("✅ Connected successfully!")
        print()
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)
    
    # Verify SV=3 schemas exist
    print("🔍 Verifying SV=3 schemas...")
    schemas_to_test = {
        100001: "loan_documents",
        100002: "document_provenance",
        100003: "attestations",
        100004: "audit_logs"
    }
    
    for etid, name in schemas_to_test.items():
        try:
            schema_detail = wal.schema.get_schema_details_with_ETId(etid)
            if schema_detail and schema_detail.SV == 3:
                custom_fields = [f.FieldName for f in schema_detail.Fields 
                               if f.FieldName not in {'IsDeleted', 'CreatedAt', 'UpdatedAt', 'UID', 'LastModifiedBy', 'EId', 'SV'}]
                print(f"  ✅ {name} (ETId {etid}): SV=3, Fields: {custom_fields}")
            else:
                sv = schema_detail.SV if schema_detail else "N/A"
                print(f"  ⚠️  {name} (ETId {etid}): SV={sv} (expected SV=3)")
        except Exception as e:
            print(f"  ❌ {name} (ETId {etid}): Error - {e}")
    
    print()
    print("=" * 80)
    print("STARTING MANUAL INSERT TESTS")
    print("=" * 80)
    print()
    
    results = {}
    
    # Test 1: loan_documents (SV=3: loan_id, document_hash, upload_timestamp)
    test_data_1 = {
        "loan_id": f"MANUAL-TEST-{int(datetime.now().timestamp())}",
        "document_hash": "a" * 64,  # 64-char SHA-256 hash
        "upload_timestamp": int(datetime.now().timestamp())
    }
    results['loan_documents'] = test_manual_insert(wal, 100001, "loan_documents", test_data_1)
    
    # Test 2: audit_logs (SV=3: document_id, event_type, timestamp)
    test_data_2 = {
        "document_id": f"MANUAL-DOC-{int(datetime.now().timestamp())}",
        "event_type": "manual_test",
        "timestamp": int(datetime.now().timestamp())
    }
    results['audit_logs'] = test_manual_insert(wal, 100004, "audit_logs", test_data_2)
    
    # Test 3: document_provenance (SV=3: parent_doc_id, child_doc_id, timestamp)
    test_data_3 = {
        "parent_doc_id": f"PARENT-{int(datetime.now().timestamp())}",
        "child_doc_id": f"CHILD-{int(datetime.now().timestamp())}",
        "timestamp": int(datetime.now().timestamp())
    }
    results['document_provenance'] = test_manual_insert(wal, 100002, "document_provenance", test_data_3)
    
    # Test 4: attestations (SV=3: document_id, timestamp)
    test_data_4 = {
        "document_id": f"ATTEST-DOC-{int(datetime.now().timestamp())}",
        "timestamp": int(datetime.now().timestamp())
    }
    results['attestations'] = test_manual_insert(wal, 100003, "attestations", test_data_4)
    
    # Summary
    print()
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print()
    
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    
    for schema_name, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"  {schema_name:<20} {status}")
    
    print()
    print(f"Total: {successful}/{total} successful")
    print()
    
    if successful == total:
        print("🎉 All manual inserts succeeded!")
        print("   SV=3 schemas are active and accepting data.")
        print("   Your code should work correctly now.")
    elif successful > 0:
        print("⚠️  Some inserts succeeded, some failed.")
        print("   Check which schemas are active vs inactive.")
    else:
        print("❌ All inserts failed.")
        print()
        print("Possible reasons:")
        print("  1. SV=3 schemas are not activated/published in Walacor UI")
        print("  2. Schemas need to be in 'active' or 'published' state")
        print("  3. Check Walacor UI for schema activation options")
        print("  4. Verify user permissions for data insertion")
    
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

