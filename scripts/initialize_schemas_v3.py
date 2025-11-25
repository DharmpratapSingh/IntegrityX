#!/usr/bin/env python
"""
Schema Version 3 Initialization Script for IntegrityX Financial Document System

This script creates SV=3 schemas with MINIMAL fields:
- Only hash, document ID, and timestamp stored in Walacor
- All other data stored locally in PostgreSQL

Usage:
    python scripts/initialize_schemas_v3.py

Requirements:
    - .env file with Walacor credentials
    - walacor-python-sdk installed
    - Active connection to Walacor instance

Schemas Created (SV=3):
    1. loan_documents (ETId: 100001) - Only: loan_id, document_hash, upload_timestamp
    2. document_provenance (ETId: 100002) - Only: parent_doc_id, child_doc_id, timestamp
    3. attestations (ETId: 100003) - Only: document_id, timestamp
    4. audit_logs (ETId: 100004) - Only: document_id, event_type, timestamp
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend/src directory to Python path for imports
script_dir = Path(__file__).parent
project_root = script_dir.parent
backend_src_dir = project_root / "backend" / "src"
if backend_src_dir.exists():
    sys.path.insert(0, str(backend_src_dir))
else:
    print(f"⚠️  Warning: backend/src directory not found at {backend_src_dir}")

try:
    from walacor_sdk import WalacorService
    from schemas import LoanSchemas
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Please ensure walacor-python-sdk is installed and src/schemas.py exists")
    sys.exit(1)


def load_environment():
    """Load environment variables from .env file."""
    try:
        env_candidates = [
            project_root / ".env",
            project_root / "backend" / ".env",
        ]
        env_path = next((path for path in env_candidates if path.exists()), None)
        
        if not env_path:
            print("❌ .env file not found")
            return None, None, None
        
        load_dotenv(env_path)
        
        host = os.getenv('WALACOR_HOST')
        username = os.getenv('WALACOR_USERNAME')
        password = os.getenv('WALACOR_PASSWORD')
        
        if not all([host, username, password]):
            print("❌ Missing required environment variables")
            return None, None, None
        
        return host, username, password
        
    except Exception as e:
        print(f"❌ Error loading environment: {e}")
        return None, None, None


def main():
    """Main function to create all SV=3 schemas."""
    print("=" * 70)
    print("INTEGRITYX SCHEMA VERSION 3 INITIALIZATION")
    print("=" * 70)
    print("Creating minimal schemas (hash, ID, timestamp only)")
    print("All other data stored locally in PostgreSQL")
    print()
    
    # Load environment
    print("📋 Step 1: Loading environment variables...")
    host, username, password = load_environment()
    if not all([host, username, password]):
        print("\n❌ Cannot proceed without valid environment variables")
        sys.exit(1)
    
    # Initialize Walacor service
    print("\n📋 Step 2: Connecting to Walacor...")
    try:
        wal = WalacorService(
            server=f"http://{host}/api",
            username=username,
            password=password
        )
        schemas = wal.schema.get_list_with_latest_version()
        print(f"✅ Connected to Walacor successfully!")
        print(f"   Found {len(schemas)} existing schemas")
    except Exception as e:
        print(f"❌ Failed to connect to Walacor: {e}")
        sys.exit(1)
    
    # Create SV=3 schemas
    print("\n📋 Step 3: Creating SV=3 schemas with minimal fields...")
    results = LoanSchemas.create_all_schemas_v3(wal)
    
    # Summary
    print("\n" + "=" * 70)
    print("SCHEMA VERSION 3 INITIALIZATION SUMMARY")
    print("=" * 70)
    
    successful = sum(1 for r in results.values() if r.get("status") == "created")
    total = len(results)
    
    print(f"Total schemas: {total}")
    print(f"Successful: {successful}")
    print(f"Failed: {total - successful}")
    print()
    
    for schema_name, result in results.items():
        status = result.get("status", "unknown")
        if status == "created":
            print(f"  {schema_name:<20} ✅ CREATED (SV=3)")
        elif status == "error":
            error = result.get("error", "Unknown error")
            print(f"  {schema_name:<20} ❌ FAILED: {error}")
        else:
            print(f"  {schema_name:<20} ⚠️  {status.upper()}")
    
    print()
    
    if successful == total:
        print("🎉 All SV=3 schemas created successfully!")
        print("You can now use SV=3 for minimal blockchain storage.")
        sys.exit(0)
    else:
        print("⚠️  Some schemas failed to create.")
        print("Check the errors above and retry if needed.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Schema initialization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

