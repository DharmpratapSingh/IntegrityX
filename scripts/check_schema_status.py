#!/usr/bin/env python
"""
Check Schema Status in Walacor

This script checks the status of SV=3 schemas and provides information
about what might be needed to activate them.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

script_dir = Path(__file__).parent
project_root = script_dir.parent
backend_src_dir = project_root / "backend" / "src"
sys.path.insert(0, str(backend_src_dir))

try:
    from walacor_sdk import WalacorService
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)

def main():
    print("=" * 80)
    print("SCHEMA STATUS CHECK")
    print("=" * 80)
    print()
    
    env_path = project_root / "backend" / ".env"
    load_dotenv(env_path)
    
    host = os.getenv('WALACOR_HOST')
    username = os.getenv('WALACOR_USERNAME')
    password = os.getenv('WALACOR_PASSWORD')
    
    if not all([host, username, password]):
        print("❌ Missing Walacor credentials")
        sys.exit(1)
    
    wal = WalacorService(
        server=f"http://{host}/api",
        username=username,
        password=password
    )
    
    print("🔍 Checking schema status for all IntegrityX schemas...")
    print()
    
    schemas_to_check = {
        100001: "loan_documents",
        100002: "document_provenance",
        100003: "attestations",
        100004: "audit_logs"
    }
    
    for etid, name in schemas_to_check.items():
        print(f"📋 {name} (ETId {etid}):")
        
        # Check available versions
        try:
            versions = wal.schema.get_versions_for_ETId(etid)
            print(f"   Available versions: {versions}")
        except Exception as e:
            print(f"   ⚠️  Could not get versions: {e}")
        
        # Get schema details
        try:
            schema_detail = wal.schema.get_schema_details_with_ETId(etid)
            if schema_detail:
                print(f"   Current SV: {schema_detail.SV}")
                print(f"   TableName: {schema_detail.TableName}")
                print(f"   Family: {schema_detail.Family}")
                print(f"   IsDeleted: {schema_detail.IsDeleted}")
                print(f"   Fields count: {len(schema_detail.Fields) if schema_detail.Fields else 0}")
                
                if schema_detail.SV == 3:
                    custom_fields = [f.FieldName for f in schema_detail.Fields 
                                   if f.FieldName not in {'IsDeleted', 'CreatedAt', 'UpdatedAt', 'UID', 'LastModifiedBy', 'EId', 'SV'}]
                    print(f"   ✅ SV=3 exists with fields: {custom_fields}")
                else:
                    print(f"   ⚠️  Latest version is SV={schema_detail.SV}, not SV=3")
            else:
                print(f"   ❌ Schema not found")
        except Exception as e:
            print(f"   ❌ Error getting schema details: {e}")
        
        print()
    
    print("=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    print()
    print("If you see 'Invalid Table Req for ETId and SV' error in the UI:")
    print("  1. The schemas exist but may not be properly activated")
    print("  2. Check the Walacor UI Schema Management section")
    print("  3. Look for 'Activate', 'Publish', or 'Enable' options")
    print("  4. Ensure SV=3 is set as the active version")
    print("  5. Verify your user has admin permissions")
    print()

if __name__ == "__main__":
    main()

