#!/usr/bin/env python
"""
Check Walacor Schemas Script

This script lists all existing schemas on your Walacor tenant and checks
if the required schemas for IntegrityX already exist.
"""

import os
import sys
from pathlib import Path
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
    print("Please ensure walacor-python-sdk is installed")
    sys.exit(1)


def main():
    print("=" * 70)
    print("WALACOR SCHEMA CHECKER")
    print("=" * 70)
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
        print("❌ Missing Walacor credentials in .env")
        sys.exit(1)

    # Connect to Walacor
    print(f"📡 Connecting to Walacor at: {host}")
    try:
        wal = WalacorService(
            server=f"http://{host}/api",
            username=username,
            password=password
        )

        schemas = wal.schema.get_list_with_latest_version()
        print(f"✅ Connected successfully!")
        print(f"   Found {len(schemas)} schemas on tenant")
        print()

    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)

    # Required schemas for IntegrityX
    required_schemas = {
        100001: "loan_documents",
        100002: "document_provenance",
        100003: "attestations",
        100004: "audit_logs"
    }

    # Check for meta-schema (needed to create schemas)
    print("🔍 Checking for Schema Creation Meta-Schema:")
    meta_schema_found = False
    for schema in schemas:
        schema_data = schema.model_dump()
        if schema_data.get('ETId') == 50:
            print(f"   ✅ Found ETId 50 (Schema Creation) - SV {schema_data.get('SV', 'Unknown')}")
            meta_schema_found = True
            break

    if not meta_schema_found:
        print(f"   ❌ ETId 50 (Schema Creation Meta-Schema) NOT FOUND")
        print(f"   💡 This is why schema creation is failing")
    print()

    # Check for required IntegrityX schemas
    print("🔍 Checking for Required IntegrityX Schemas:")
    found_schemas = {}

    for schema in schemas:
        schema_data = schema.model_dump()
        etid = schema_data.get('ETId')

        if etid in required_schemas:
            table_name = schema_data.get('TableName', 'Unknown')
            sv = schema_data.get('SV', 'Unknown')
            found_schemas[etid] = (table_name, sv)
            print(f"   ✅ ETId {etid} ({required_schemas[etid]}) - Found as '{table_name}' (SV {sv})")

    # Check for missing schemas
    missing_schemas = set(required_schemas.keys()) - set(found_schemas.keys())

    if missing_schemas:
        print()
        print("⚠️  Missing Required Schemas:")
        for etid in sorted(missing_schemas):
            print(f"   ❌ ETId {etid} ({required_schemas[etid]}) - NOT FOUND")

    print()
    print("=" * 70)
    print("ALL SCHEMAS ON TENANT:")
    print("=" * 70)

    # List all schemas
    for i, schema in enumerate(schemas, 1):
        schema_data = schema.model_dump()
        etid = schema_data.get('ETId', 'Unknown')
        sv = schema_data.get('SV', 'Unknown')
        table_name = schema_data.get('TableName', 'Unknown')
        family = schema_data.get('Family', 'Unknown')

        print(f"{i:2}. ETId={etid:<6} SV={sv:<3} Table={table_name:<30} Family={family}")

    print()
    print("=" * 70)
    print("SUMMARY:")
    print("=" * 70)

    if not meta_schema_found:
        print("❌ Cannot create schemas programmatically (ETId 50 missing)")
        print("💡 RECOMMENDATION: Create schemas manually via Walacor Dashboard")
    elif missing_schemas:
        print(f"⚠️  {len(missing_schemas)} required schemas are missing")
        print("💡 RECOMMENDATION: Run initialize_schemas.py to create them")
    else:
        print("✅ All required schemas exist!")
        print("🎉 Your IntegrityX system is ready to use")


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
