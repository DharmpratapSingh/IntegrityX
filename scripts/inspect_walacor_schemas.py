#!/usr/bin/env python

"""

Detailed Walacor Schema Inspector

 

This script connects to Walacor and displays the complete field definitions

for all IntegrityX schemas, allowing comparison with expected structure.

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

    print("=" * 80)

    print("WALACOR SCHEMA FIELD INSPECTOR")

    print("=" * 80)

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

        print(f"✅ Connected successfully!")

        print()

    except Exception as e:

        print(f"❌ Failed to connect: {e}")

        sys.exit(1)

 

    # Target schemas

    target_schemas = {

        100001: "loan_documents",

        100002: "document_provenance",

        100003: "attestations",

        100004: "audit_logs"

    }

 

        # Get all schemas first

    try:

        all_schemas = wal.schema.get_list_with_latest_version()

    except Exception as e:

        print(f"❌ Failed to get schema list: {e}")

        sys.exit(1)

 

    # Inspect each schema

    for etid, expected_name in target_schemas.items():

        print("=" * 80)

        print(f"SCHEMA: {expected_name} (ETId {etid})")

        print("=" * 80)

 

        try:

            # Find schema in list

            schema_detail = None

            for schema in all_schemas:

                if schema.ETId == etid:

                    schema_detail = schema

                    break

 

            if not schema_detail:

                print(f"❌ Schema not found in Walacor!")

                print()

                continue

 

            schema_data = schema_detail.model_dump()

 

            # Basic info

            print(f"Table Name:     {schema_data.get('TableName', 'N/A')}")

            print(f"Schema Version: {schema_data.get('SV', 'N/A')}")

            print(f"Family:         {schema_data.get('Family', 'N/A')}")

            print()

 

            # Fields

            print("FIELDS:")

            print("-" * 80)

            fields = schema_data.get('Fields', [])

 

            if not fields:

                print("   ⚠️  No fields defined!")

            else:

                print(f"{'Field Name':<25} {'Type':<20} {'Required':<10} {'Max Length':<12}")

                print("-" * 80)

                for field in fields:

                    field_name = field.get('FieldName', 'Unknown')

                    data_type = field.get('DataType', 'Unknown')

                    required = "Yes" if field.get('Required', False) else "No"

                    max_length = field.get('MaxLength', 'N/A')

 

                    print(f"{field_name:<25} {data_type:<20} {required:<10} {str(max_length):<12}")

 

            print()

 

            # Indexes

            print("INDEXES:")

            print("-" * 80)

            indexes = schema_data.get('Indexes', [])

 

            if not indexes:

                print("   ⚠️  No indexes defined!")

            else:

                for idx in indexes:

                    idx_name = idx.get('IndexValue', 'Unknown')

                    idx_fields = idx.get('Fields', [])

                    print(f"   • {idx_name}: {', '.join(idx_fields)}")

 

            print()

 

        except Exception as e:

            print(f"❌ Failed to fetch schema details: {e}")

            print()

 

    # Now show what we EXPECT

    print()

    print("=" * 80)

    print("EXPECTED SCHEMA DEFINITIONS (from backend/src/schemas.py)")

    print("=" * 80)

    print()

 

    print("📋 EXPECTED: loan_documents (100001)")

    print("-" * 80)

    print("Fields:")

    print("  • loan_id          (TEXT, Required, max 2048)")

    print("  • document_type    (TEXT, Required)")

    print("  • document_hash    (TEXT, Required)")

    print("  • file_size        (INTEGER, Required)")

    print("  • upload_timestamp (DATETIME_EPOCH, Required)")

    print("  • uploaded_by      (TEXT, Required)")

    print("  • file_path        (TEXT, Required)")

    print("Indexes:")

    print("  • idx_loan_id: loan_id")

    print("  • idx_document_hash: document_hash")

    print()

 

    print("📋 EXPECTED: document_provenance (100002)")

    print("-" * 80)

    print("Fields:")

    print("  • parent_doc_id     (TEXT, Required)")

    print("  • child_doc_id      (TEXT, Required)")

    print("  • relationship_type (TEXT, Required)")

    print("  • timestamp         (DATETIME_EPOCH, Required)")

    print("  • description       (TEXT, Optional)")

    print("Indexes:")

    print("  • idx_parent_doc_id: parent_doc_id")

    print("  • idx_child_doc_id: child_doc_id")

    print()

 

    print("📋 EXPECTED: attestations (100003)")

    print("-" * 80)

    print("Fields:")

    print("  • document_id       (TEXT, Required)")

    print("  • attestor_name     (TEXT, Required)")

    print("  • attestation_type  (TEXT, Required)")

    print("  • status            (TEXT, Required)")

    print("  • timestamp         (DATETIME_EPOCH, Required)")

    print("  • signature         (TEXT, Optional)")

    print("  • notes             (TEXT, Optional)")

    print("Indexes:")

    print("  • idx_document_id: document_id")

    print()

 

    print("📋 EXPECTED: audit_logs (100004)")

    print("-" * 80)

    print("Fields:")

    print("  • document_id  (TEXT, Required)")

    print("  • event_type   (TEXT, Required)")

    print("  • user         (TEXT, Required)")

    print("  • timestamp    (DATETIME_EPOCH, Required)")

    print("  • ip_address   (TEXT, Optional)")

    print("  • details      (TEXT, Optional)")

    print("Indexes:")

    print("  • idx_document_id: document_id")

    print("  • idx_timestamp: timestamp")

    print()

 

    print("=" * 80)

    print("NEXT STEPS:")

    print("=" * 80)

    print("1. Compare the ACTUAL fields (above) with EXPECTED fields")

    print("2. If they don't match, update schemas in Walacor Dashboard")

    print("3. Go to http://{} and navigate to Schemas".format(host))

    print("4. Update each schema's SV 2 to match the EXPECTED definitions")

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