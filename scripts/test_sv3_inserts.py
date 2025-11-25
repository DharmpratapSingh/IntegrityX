#!/usr/bin/env python
"""
Test SV=3 Minimal Field Inserts

This script tests inserting data into Walacor using Schema Version 3 (SV=3)
with minimal fields (hash, ID, timestamp only).

All other data is stored locally in PostgreSQL.
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
    from walacor_service import WalacorIntegrityService
    from walacor_sdk import WalacorService
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)


def test_sv3_schema_fields(wal):
    """Verify SV=3 schemas exist and have correct minimal fields."""
    print("=" * 80)
    print("VERIFYING SV=3 SCHEMAS")
    print("=" * 80)
    print()
    
    schemas_to_check = {
        100001: ("loan_documents", ["loan_id", "document_hash", "upload_timestamp"]),
        100002: ("document_provenance", ["parent_doc_id", "child_doc_id", "timestamp"]),
        100003: ("attestations", ["document_id", "timestamp"]),
        100004: ("audit_logs", ["document_id", "event_type", "timestamp"])
    }
    
    all_ok = True
    for etid, (name, expected_fields) in schemas_to_check.items():
        try:
            schema_detail = wal.schema.get_schema_details_with_ETId(etid)
            if schema_detail:
                if schema_detail.SV == 3:
                    custom_fields = [f.FieldName for f in schema_detail.Fields 
                                   if f.FieldName not in {'IsDeleted', 'CreatedAt', 'UpdatedAt', 'UID', 'LastModifiedBy', 'EId', 'SV'}]
                    if set(custom_fields) == set(expected_fields):
                        print(f"✅ {name} (ETId {etid}): SV=3, Fields: {custom_fields}")
                    else:
                        print(f"⚠️  {name} (ETId {etid}): SV=3, but fields don't match")
                        print(f"   Expected: {expected_fields}")
                        print(f"   Got: {custom_fields}")
                        all_ok = False
                else:
                    print(f"❌ {name} (ETId {etid}): SV={schema_detail.SV} (expected SV=3)")
                    all_ok = False
            else:
                print(f"❌ {name} (ETId {etid}): Schema not found")
                all_ok = False
        except Exception as e:
            print(f"❌ {name} (ETId {etid}): Error checking schema: {e}")
            all_ok = False
    
    print()
    return all_ok


def test_loan_document_insert(wal_service):
    """Test inserting a loan document with SV=3 minimal fields."""
    print("=" * 80)
    print("TEST 1: Insert Loan Document (SV=3 minimal fields)")
    print("=" * 80)
    print()
    print("SV=3 fields: loan_id, document_hash, upload_timestamp")
    print("All other data stored locally in PostgreSQL")
    print()
    
    try:
        result = wal_service.store_document_hash(
            loan_id="TEST-LOAN-SV3-001",
            document_type="test_document",  # Stored locally only
            document_hash="a" * 64,  # 64-char SHA-256 hash
            file_size=1024000,  # Stored locally only
            file_path="/test/path/document.pdf",  # Stored locally only
            uploaded_by="test_user"  # Stored locally only
        )
        
        print("✅ INSERT SUCCESSFUL!")
        print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
        if isinstance(result, dict):
            if 'walacor_tx_id' in result:
                print(f"Walacor TX ID: {result['walacor_tx_id']}")
            if 'mode' in result:
                print(f"Mode: {result['mode']}")
        print()
        return True
        
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print()
        return False


def test_audit_log_insert(wal_service):
    """Test inserting an audit log with SV=3 minimal fields."""
    print("=" * 80)
    print("TEST 2: Insert Audit Log (SV=3 minimal fields)")
    print("=" * 80)
    print()
    print("SV=3 fields: document_id, event_type, timestamp")
    print("All other data (user, ip_address, details) stored locally in PostgreSQL")
    print()
    
    try:
        result = wal_service.log_audit_event(
            document_id="TEST-DOC-SV3-001",
            event_type="test_insert",
            user="test_user@example.com",  # Stored locally only
            ip_address="127.0.0.1",  # Stored locally only
            details="Test audit log entry"  # Stored locally only
        )
        
        print("✅ INSERT SUCCESSFUL!")
        print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
        if isinstance(result, dict):
            if 'walacor_tx_id' in result or 'tx_id' in result:
                tx_id = result.get('walacor_tx_id') or result.get('tx_id')
                print(f"Transaction ID: {tx_id}")
            if 'mode' in result:
                print(f"Mode: {result['mode']}")
        print()
        return True
        
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print()
        return False


def test_provenance_insert(wal_service):
    """Test inserting a provenance link with SV=3 minimal fields."""
    print("=" * 80)
    print("TEST 3: Insert Provenance Link (SV=3 minimal fields)")
    print("=" * 80)
    print()
    print("SV=3 fields: parent_doc_id, child_doc_id, timestamp")
    print("All other data (relationship_type, description) stored locally in PostgreSQL")
    print()
    
    try:
        result = wal_service.create_provenance_link(
            parent_doc_id="PARENT-DOC-001",
            child_doc_id="CHILD-DOC-001",
            relationship_type="derived_from",  # Stored locally only
            description="Test provenance link"  # Stored locally only
        )
        
        print("✅ INSERT SUCCESSFUL!")
        print(f"Result: {result}")
        print()
        return True
        
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print()
        return False


def test_attestation_insert(wal_service):
    """Test inserting an attestation with SV=3 minimal fields."""
    print("=" * 80)
    print("TEST 4: Insert Attestation (SV=3 minimal fields)")
    print("=" * 80)
    print()
    print("SV=3 fields: document_id, timestamp")
    print("All other data (attestor_name, attestation_type, status, signature, notes) stored locally in PostgreSQL")
    print()
    
    try:
        result = wal_service.create_attestation(
            document_id="TEST-DOC-001",
            attestor_name="Test Attestor",  # Stored locally only
            attestation_type="legal",  # Stored locally only
            status="approved",  # Stored locally only
            signature="sig123",  # Stored locally only
            notes="Test attestation"  # Stored locally only
        )
        
        print("✅ INSERT SUCCESSFUL!")
        print(f"Result: {result}")
        print()
        return True
        
    except Exception as e:
        print(f"❌ INSERT FAILED!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print()
        return False


def main():
    print("=" * 80)
    print("WALACOR SV=3 MINIMAL FIELD INSERT TEST")
    print("=" * 80)
    print()
    print("Testing Schema Version 3 with minimal fields:")
    print("- Only hash, document ID, and timestamp stored in Walacor")
    print("- All other data stored locally in PostgreSQL")
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
    
    # Initialize services
    print("📡 Initializing Walacor services...")
    try:
        wal_service = WalacorIntegrityService()
        wal = wal_service.wal
        print("✅ Services initialized")
        print()
    except Exception as e:
        print(f"❌ Failed to initialize services: {e}")
        sys.exit(1)
    
    # Verify SV=3 schemas
    if not test_sv3_schema_fields(wal):
        print("⚠️  Warning: SV=3 schemas not properly configured")
        print("   Continuing with tests anyway...")
        print()
    
    # Run tests
    results = {}
    
    results['loan_document'] = test_loan_document_insert(wal_service)
    results['audit_log'] = test_audit_log_insert(wal_service)
    results['provenance'] = test_provenance_insert(wal_service)
    results['attestation'] = test_attestation_insert(wal_service)
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print()
    
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name:<20} {status}")
    
    print()
    print(f"Total: {successful}/{total} tests passed")
    print()
    
    if successful == total:
        print("🎉 All tests passed! SV=3 inserts are working correctly.")
    else:
        print("⚠️  Some tests failed. Check errors above.")
        print("   Note: If schemas aren't activated in Walacor UI, inserts will fail.")
    
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

