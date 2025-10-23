"""
Simple Integration Test for Document Delete Functionality

This test focuses on the core functionality without complex hash generation.
"""

import json
import uuid
import time
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import the models and database classes
try:
    from src.models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument
    from src.database import Database
except ImportError:
    # Fallback for when running as script
    from models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument
    from database import Database


def create_valid_hash(prefix, index):
    """Create a valid 64-character hash."""
    base = f"{prefix}_{index:02d}_123456789012345678901234567890abcdef1234567890abcdef"
    return base[:64]


def run_simple_integration_test():
    """Run a simple integration test."""
    print("🚀 STARTING SIMPLE INTEGRATION TEST")
    print("=" * 50)
    
    # Setup
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    db = Database(db_url="sqlite:///:memory:")
    db.session = session
    
    try:
        print("🔧 Setting up test data...")
        
        # Create a test artifact
        test_artifact = Artifact(
            id=str(uuid.uuid4()),
            loan_id="INTEGRATION_TEST_LOAN_001",
            artifact_type="loan_packet",
            etid=100001,
            payload_sha256=create_valid_hash("integration_hash", 0),
            manifest_sha256=create_valid_hash("integration_manifest", 0),
            walacor_tx_id="WAL_TX_INTEGRATION_001",
            created_by="integration_test_user@example.com",
            blockchain_seal="integration_test_seal",
            local_metadata={
                "file_size": 2048000,
                "file_path": "/integration/test/document.pdf",
                "security_level": "standard"
            },
            borrower_info={
                "full_name": "Integration Test User",
                "email": "integration_test_user@example.com",
                "loan_amount": 300000
            }
        )
        
        session.add(test_artifact)
        
        # Add files
        for j in range(2):
            file = ArtifactFile(
                id=str(uuid.uuid4()),
                artifact_id=test_artifact.id,
                name=f"integration_test_document_{j+1}.pdf",
                uri=f"/integration/test/document_{j+1}.pdf",
                sha256=create_valid_hash("integration_file", j),
                size_bytes=1024000 + j * 1000,
                content_type="application/pdf"
            )
            session.add(file)
        
        # Add event
        event = ArtifactEvent(
            id=str(uuid.uuid4()),
            artifact_id=test_artifact.id,
            event_type="uploaded",
            payload_json=json.dumps({"status": "success", "files_count": 2}),
            payload_sha256=create_valid_hash("integration_event", 0),
            walacor_tx_id="WAL_TX_INTEGRATION_EVENT_001",
            created_by="integration_test_user@example.com"
        )
        session.add(event)
        
        session.commit()
        print(f"✅ Created test artifact: {test_artifact.id}")
        
        # Test 1: Basic deletion
        print("\n🧪 Test 1: Basic Document Deletion")
        print("-" * 40)
        
        original_id = test_artifact.id
        original_hash = test_artifact.payload_sha256
        
        # Verify artifact exists
        assert db.get_artifact_by_id(original_id) is not None
        print("✅ Artifact exists before deletion")
        
        # Delete the artifact
        result = db.delete_artifact(
            artifact_id=original_id,
            deleted_by="integration_deleter@example.com",
            deletion_reason="Integration test deletion"
        )
        
        print(f"✅ Artifact deleted: {result['deleted_artifact_id']}")
        
        # Verify artifact is removed
        assert db.get_artifact_by_id(original_id) is None
        print("✅ Artifact removed from active table")
        
        # Test 2: Verification after deletion
        print("\n🧪 Test 2: Verification After Deletion")
        print("-" * 40)
        
        # Verify by hash
        deleted_doc = db.get_deleted_document_by_hash(original_hash)
        assert deleted_doc is not None
        print(f"✅ Found deleted document by hash: {original_hash[:16]}...")
        
        # Test verification info
        verification_info = deleted_doc.get_verification_info()
        assert verification_info["status"] == "deleted"
        print(f"✅ Verification info: {verification_info['verification_message']}")
        
        # Test 3: Metadata preservation
        print("\n🧪 Test 3: Metadata Preservation")
        print("-" * 40)
        
        # Verify all metadata is preserved
        assert deleted_doc.loan_id == test_artifact.loan_id
        assert deleted_doc.payload_sha256 == test_artifact.payload_sha256
        assert deleted_doc.original_created_by == test_artifact.created_by
        assert deleted_doc.borrower_info == test_artifact.borrower_info
        assert deleted_doc.files_info is not None
        assert len(deleted_doc.files_info) == 2
        
        print("✅ All metadata preserved correctly")
        print(f"✅ Files info preserved: {len(deleted_doc.files_info)} files")
        
        # Test 4: Error handling
        print("\n🧪 Test 4: Error Handling")
        print("-" * 40)
        
        # Test deleting non-existent artifact
        try:
            db.delete_artifact(
                artifact_id="nonexistent_id",
                deleted_by="test_deleter@example.com"
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Artifact not found" in str(e)
            print("✅ Correctly handles non-existent artifact deletion")
        
        # Test retrieving non-existent deleted document
        nonexistent_hash = "nonexistent_hash" + "0" * (64 - len("nonexistent_hash"))
        deleted_doc = db.get_deleted_document_by_hash(nonexistent_hash)
        assert deleted_doc is None
        print("✅ Correctly handles non-existent hash retrieval")
        
        # Test 5: Performance
        print("\n🧪 Test 5: Performance Test")
        print("-" * 40)
        
        # Create additional test artifacts
        start_time = time.time()
        perf_artifacts = []
        
        for i in range(5):
            artifact = Artifact(
                id=str(uuid.uuid4()),
                loan_id=f"PERF_LOAN_{i+1:03d}",
                artifact_type="loan_packet",
                etid=100001,
                payload_sha256=create_valid_hash("perf_hash", i),
                manifest_sha256=create_valid_hash("perf_manifest", i),
                walacor_tx_id=f"WAL_TX_PERF_{i+1:03d}",
                created_by=f"perf_user_{i+1}@example.com",
                blockchain_seal=f"perf_seal_{i+1}",
                local_metadata={"file_size": 1024000, "file_path": f"/perf/loan_{i+1}.pdf"},
                borrower_info={"full_name": f"Performance User {i+1}", "email": f"perf{i+1}@example.com", "loan_amount": 100000 + i * 10000}
            )
            
            session.add(artifact)
            perf_artifacts.append(artifact)
        
        session.commit()
        creation_time = time.time() - start_time
        print(f"✅ Created {len(perf_artifacts)} performance test artifacts in {creation_time:.3f} seconds")
        
        # Test deletion performance
        start_time = time.time()
        deleted_count = 0
        
        for artifact in perf_artifacts:
            try:
                db.delete_artifact(
                    artifact_id=artifact.id,
                    deleted_by="perf_deleter@example.com",
                    deletion_reason="Performance test deletion"
                )
                deleted_count += 1
            except Exception as e:
                print(f"❌ Failed to delete performance artifact {artifact.id}: {e}")
        
        deletion_time = time.time() - start_time
        print(f"✅ Deleted {deleted_count} artifacts in {deletion_time:.3f} seconds")
        print(f"✅ Average deletion time: {deletion_time/deleted_count:.3f} seconds per document")
        
        # Test verification performance
        start_time = time.time()
        verification_count = 0
        
        for artifact in perf_artifacts:
            deleted_doc = db.get_deleted_document_by_hash(artifact.payload_sha256)
            if deleted_doc:
                verification_info = deleted_doc.get_verification_info()
                verification_count += 1
        
        verification_time = time.time() - start_time
        print(f"✅ Verified {verification_count} deleted documents in {verification_time:.3f} seconds")
        print(f"✅ Average verification time: {verification_time/verification_count:.3f} seconds per document")
        
        # Test 6: Database consistency
        print("\n🧪 Test 6: Database Consistency")
        print("-" * 40)
        
        # Get database info
        db_info = db.get_database_info()
        print("📊 Database statistics:")
        print(f"   Artifacts: {db_info['table_counts']['artifacts']}")
        print(f"   Deleted Documents: {db_info['table_counts']['deleted_documents']}")
        print(f"   Artifact Files: {db_info['table_counts']['artifact_files']}")
        print(f"   Artifact Events: {db_info['table_counts']['artifact_events']}")
        print(f"   Total Records: {db_info['total_records']}")
        
        # Verify data consistency
        deleted_docs = session.query(DeletedDocument).all()
        print(f"✅ Found {len(deleted_docs)} deleted documents in database")
        
        for deleted_doc in deleted_docs:
            # Verify that original artifact doesn't exist in active table
            original_exists = db.get_artifact_by_id(deleted_doc.original_artifact_id) is not None
            assert not original_exists, f"Original artifact {deleted_doc.original_artifact_id} still exists in active table"
            
            # Verify hash consistency
            assert len(deleted_doc.payload_sha256) == 64, f"Invalid hash length for {deleted_doc.original_artifact_id}"
            
            # Verify verification info is complete
            verification_info = deleted_doc.get_verification_info()
            assert verification_info["status"] == "deleted"
            assert "verification_message" in verification_info
        
        print("✅ Data integrity and consistency verified")
        
        print("\n" + "=" * 50)
        print("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        session.close()


if __name__ == "__main__":
    success = run_simple_integration_test()
    exit(0 if success else 1)
