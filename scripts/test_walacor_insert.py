#!/usr/bin/env python
"""
Test Walacor Data Insertion

This script directly tests inserting data into Walacor schemas to diagnose issues.
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


def main():
    print("=" * 80)
    print("WALACOR DATA INSERTION TEST")
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

    # Test 1: Insert into loan_documents (ETId 100001)
    print("=" * 80)
    print("TEST 1: Insert into loan_documents (ETId 100001)")
    print("=" * 80)

    test_data = {
        "loan_id": "TEST-LOAN-001",
        "document_type": "test_document",
        "document_hash": "a" * 64,  # 64-char hash
        "file_size": 1024000,
        "upload_timestamp": int(datetime.now().timestamp()),
        "uploaded_by": "test_user",
        "file_path": "/test/path/document.pdf"
    }

    print("Data to insert:")
    print(json.dumps(test_data, indent=2))
    print()

    try:
        result = wal.data_requests.insert_single_record(
            jsonRecord=json.dumps(test_data),
            ETId=100001
        )
        print("✅ INSERT SUCCESSFUL!")
        print("Response:")
        print(json.dumps(result, indent=2, default=str))
        print()
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print()

        # Try to get more details
        if hasattr(e, 'response'):
            print("Response details:")
            print(f"  Status: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
            print(f"  Body: {e.response.text if hasattr(e.response, 'text') else 'N/A'}")
        print()

    # Test 2: Insert into audit_logs (ETId 100004)
    print("=" * 80)
    print("TEST 2: Insert into audit_logs (ETId 100004)")
    print("=" * 80)

    audit_data = {
        "document_id": "DOC-001",
        "event_type": "test_event",
        "user": "test_user@example.com",
        "timestamp": int(datetime.now().timestamp()),
        "ip_address": "127.0.0.1",
        "details": "Test audit log entry"
    }

    print("Data to insert:")
    print(json.dumps(audit_data, indent=2))
    print()

    try:
        result = wal.data_requests.insert_single_record(
            jsonRecord=json.dumps(audit_data),
            ETId=100004
        )
        print("✅ INSERT SUCCESSFUL!")
        print("Response:")
        print(json.dumps(result, indent=2, default=str))
        print()
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print()

        # Try to get more details
        if hasattr(e, 'response'):
            print("Response details:")
            print(f"  Status: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
            print(f"  Body: {e.response.text if hasattr(e.response, 'text') else 'N/A'}")
        print()

    print("=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


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
