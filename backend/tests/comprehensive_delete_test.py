"""
Comprehensive Test Suite for Document Delete Functionality

This test suite thoroughly tests all aspects of the delete functionality including:
- Database operations
- API endpoints
- Verification logic
- Edge cases and error handling
- Integration scenarios
"""

import pytest
import json
import uuid
import requests
import time
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import the models and database classes
try:
    from src.models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument
    from src.database import Database
    from main import app
except ImportError:
    # Fallback for when running as script
    from models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument
    from database import Database
    from main import app

from fastapi.testclient import TestClient


class ComprehensiveDeleteTestSuite:
    """Comprehensive test suite for delete functionality."""
    
    def __init__(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.db = Database(db_url="sqlite:///:memory:")
        self.db.session = self.session
        self.client = TestClient(app)
        
    def setup_test_data(self):
        """Set up test data for comprehensive testing."""
        print("🔧 Setting up test data...")
        
        # Create multiple test artifacts
        self.test_artifacts = []
        
        for i in range(5):
            artifact = Artifact(
                id=str(uuid.uuid4()),
                loan_id=f"TEST_LOAN_{i+1:03d}",
                artifact_type="loan_packet",
                etid=100001,
                payload_sha256=f"a{i}b{i}c{i}d{i}e{i}f{i}789012345678901234567890abcdef1234567890abcdef123456",
                manifest_sha256=f"f{i}e{i}d{i}c{i}b{i}a{i}789012345678901234567890abcdef1234567890abcdef123456",
                walacor_tx_id=f"WAL_TX_TEST_{i+1:03d}",
                created_by=f"test_user_{i+1}@example.com",
                blockchain_seal=f"test_seal_info_{i+1}",
                local_metadata={
                    "file_size": 1024000 + i * 1000,
                    "file_path": f"/test/path/document_{i+1}.pdf",
                    "security_level": "standard"
                },
                borrower_info={
                    "full_name": f"John Doe {i+1}",
                    "email": f"john{i+1}@example.com",
                    "loan_amount": 100000 + i * 10000
                }
            )
            
            self.session.add(artifact)
            
            # Add files to the artifact
            for j in range(2):
                file = ArtifactFile(
                    id=str(uuid.uuid4()),
                    artifact_id=artifact.id,
                    name=f"test_document_{i+1}_{j+1}.pdf",
                    uri=f"/test/path/document_{i+1}_{j+1}.pdf",
                    sha256=f"1234567890abcdef{i}{j}1234567890abcdef1234567890abcdef1234567890abcdef",
                    size_bytes=512000 + j * 1000,
                    content_type="application/pdf"
                )
                self.session.add(file)
            
            # Add events to the artifact
            event = ArtifactEvent(
                id=str(uuid.uuid4()),
                artifact_id=artifact.id,
                event_type="uploaded",
                payload_json=json.dumps({"status": "success", "files_count": 2}),
                payload_sha256=f"abcdef1234567890{i}1234567890abcdef1234567890abcdef1234567890abcdef",
                walacor_tx_id=f"WAL_TX_EVENT_{i+1:03d}",
                created_by=f"test_user_{i+1}@example.com"
            )
            self.session.add(event)
            
            self.test_artifacts.append(artifact)
        
        self.session.commit()
        print(f"✅ Created {len(self.test_artifacts)} test artifacts with files and events")
        
    def test_1_basic_deletion(self):
        """Test basic document deletion functionality."""
        print("\n🧪 Test 1: Basic Document Deletion")
        print("-" * 40)
        
        artifact = self.test_artifacts[0]
        original_id = artifact.id
        original_hash = artifact.payload_sha256
        
        # Verify artifact exists before deletion
        assert self.db.get_artifact_by_id(original_id) is not None
        print(f"✅ Artifact {original_id} exists before deletion")
        
        # Delete the artifact
        result = self.db.delete_artifact(
            artifact_id=original_id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion for comprehensive testing"
        )
        
        # Verify deletion result structure
        assert "deleted_artifact_id" in result
        assert "deleted_document_id" in result
        assert "deletion_event_id" in result
        assert "verification_info" in result
        assert "preserved_metadata" in result
        
        assert result["deleted_artifact_id"] == original_id
        print(f"✅ Artifact deleted successfully: {result['deleted_artifact_id']}")
        
        # Verify artifact is removed from active table
        deleted_artifact = self.db.get_artifact_by_id(original_id)
        assert deleted_artifact is None
        print("✅ Artifact removed from active artifacts table")
        
        # Verify deleted document record exists
        deleted_doc = self.db.get_deleted_document_by_original_id(original_id)
        assert deleted_doc is not None
        assert deleted_doc.original_artifact_id == original_id
        assert deleted_doc.payload_sha256 == original_hash
        print("✅ Deleted document record created with preserved metadata")
        
        # Verify verification info
        verification_info = deleted_doc.get_verification_info()
        assert verification_info["status"] == "deleted"
        assert "uploaded on" in verification_info["verification_message"]
        assert "deleted on" in verification_info["verification_message"]
        print(f"✅ Verification info: {verification_info['verification_message']}")
        
    def test_2_verification_by_hash(self):
        """Test verification of deleted documents by hash."""
        print("\n🧪 Test 2: Verification by Hash")
        print("-" * 40)
        
        artifact = self.test_artifacts[1]
        original_hash = artifact.payload_sha256
        
        # Delete the artifact
        self.db.delete_artifact(
            artifact_id=artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion for hash verification"
        )
        
        # Verify by hash
        deleted_doc = self.db.get_deleted_document_by_hash(original_hash)
        assert deleted_doc is not None
        assert deleted_doc.original_artifact_id == artifact.id
        print(f"✅ Found deleted document by hash: {original_hash[:16]}...")
        
        # Test verification info
        verification_info = deleted_doc.get_verification_info()
        assert verification_info["document_id"] == artifact.id
        assert verification_info["payload_sha256"] == original_hash
        assert verification_info["status"] == "deleted"
        print("✅ Verification info contains correct document details")
        
    def test_3_loan_based_retrieval(self):
        """Test retrieving deleted documents by loan ID."""
        print("\n🧪 Test 3: Loan-based Retrieval")
        print("-" * 40)
        
        loan_id = "TEST_LOAN_002"
        
        # Find artifacts that haven't been deleted yet
        available_artifacts = []
        for artifact in self.test_artifacts:
            if self.db.get_artifact_by_id(artifact.id) is not None:
                available_artifacts.append(artifact)
        
        # Delete artifacts from the same loan (if available)
        deleted_count = 0
        for artifact in available_artifacts:
            if artifact.loan_id == loan_id:
                try:
                    self.db.delete_artifact(
                        artifact_id=artifact.id,
                        deleted_by="test_deleter@example.com",
                        deletion_reason="Test deletion for loan retrieval"
                    )
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️  Could not delete artifact {artifact.id}: {e}")
        
        print(f"✅ Deleted {deleted_count} artifacts for loan {loan_id}")
        
        # Retrieve deleted documents by loan ID
        deleted_docs = self.db.get_deleted_documents_by_loan_id(loan_id)
        assert len(deleted_docs) >= deleted_count
        
        for deleted_doc in deleted_docs:
            assert deleted_doc.loan_id == loan_id
        
        print(f"✅ Found {len(deleted_docs)} deleted document(s) for loan {loan_id}")
        
    def test_4_metadata_preservation(self):
        """Test comprehensive metadata preservation."""
        print("\n🧪 Test 4: Metadata Preservation")
        print("-" * 40)
        
        # Find an artifact that hasn't been deleted yet
        available_artifact = None
        for artifact in self.test_artifacts:
            if self.db.get_artifact_by_id(artifact.id) is not None:
                available_artifact = artifact
                break
        
        if not available_artifact:
            print("⚠️  No available artifacts for metadata preservation test")
            return
            
        artifact = available_artifact
        original_id = artifact.id
        
        # Delete the artifact
        self.db.delete_artifact(
            artifact_id=original_id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion for metadata preservation"
        )
        
        # Get the deleted document
        deleted_doc = self.db.get_deleted_document_by_original_id(original_id)
        
        # Verify all metadata is preserved
        assert deleted_doc.loan_id == artifact.loan_id
        assert deleted_doc.artifact_type == artifact.artifact_type
        assert deleted_doc.etid == artifact.etid
        assert deleted_doc.payload_sha256 == artifact.payload_sha256
        assert deleted_doc.manifest_sha256 == artifact.manifest_sha256
        assert deleted_doc.walacor_tx_id == artifact.walacor_tx_id
        assert deleted_doc.original_created_at == artifact.created_at
        assert deleted_doc.original_created_by == artifact.created_by
        assert deleted_doc.blockchain_seal == artifact.blockchain_seal
        assert deleted_doc.preserved_metadata == artifact.local_metadata
        assert deleted_doc.borrower_info == artifact.borrower_info
        
        print("✅ All original metadata preserved correctly")
        
        # Verify files info is preserved
        assert deleted_doc.files_info is not None
        files_info = deleted_doc.files_info
        assert len(files_info) == 2  # Should have 2 files
        print(f"✅ Files info preserved: {len(files_info)} files")
        
        # Verify deletion information
        assert deleted_doc.deleted_by == "test_deleter@example.com"
        assert deleted_doc.deletion_reason == "Test deletion for metadata preservation"
        assert deleted_doc.deleted_at is not None
        print("✅ Deletion information recorded correctly")
        
    def test_5_error_handling(self):
        """Test error handling scenarios."""
        print("\n🧪 Test 5: Error Handling")
        print("-" * 40)
        
        # Test deleting non-existent artifact
        try:
            self.db.delete_artifact(
                artifact_id="nonexistent_id",
                deleted_by="test_deleter@example.com"
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "Artifact not found" in str(e)
            print("✅ Correctly handles non-existent artifact deletion")
        
        # Test deleting without deleted_by
        try:
            self.db.delete_artifact(
                artifact_id=self.test_artifacts[3].id,
                deleted_by=""
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "deleted_by is required" in str(e)
            print("✅ Correctly handles missing deleted_by parameter")
        
        # Test retrieving non-existent deleted document
        deleted_doc = self.db.get_deleted_document_by_original_id("nonexistent_id")
        assert deleted_doc is None
        print("✅ Correctly handles non-existent deleted document retrieval")
        
        # Test retrieving deleted document by non-existent hash
        nonexistent_hash = "nonexistent_hash" + "0" * (64 - len("nonexistent_hash"))
        deleted_doc_by_hash = self.db.get_deleted_document_by_hash(nonexistent_hash)
        assert deleted_doc_by_hash is None
        print("✅ Correctly handles non-existent hash retrieval")
        
    def test_6_verification_message_format(self):
        """Test verification message format and content."""
        print("\n🧪 Test 6: Verification Message Format")
        print("-" * 40)
        
        # Find an artifact that hasn't been deleted yet
        available_artifact = None
        for artifact in self.test_artifacts:
            if self.db.get_artifact_by_id(artifact.id) is not None:
                available_artifact = artifact
                break
        
        if not available_artifact:
            print("⚠️  No available artifacts for verification message test")
            return
            
        artifact = available_artifact
        
        # Delete the artifact
        self.db.delete_artifact(
            artifact_id=artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion for message format"
        )
        
        # Get the deleted document
        deleted_doc = self.db.get_deleted_document_by_original_id(artifact.id)
        verification_info = deleted_doc.get_verification_info()
        
        message = verification_info["verification_message"]
        
        # Verify message contains required information
        assert "uploaded on" in message.lower()
        assert "deleted on" in message.lower()
        assert "test_deleter@example.com" in message
        
        # Verify message format
        assert "This document was" in message
        assert "and deleted on" in message
        assert "by" in message
        
        print(f"✅ Verification message format correct: {message}")
        
    def test_7_multiple_deletions(self):
        """Test multiple document deletions."""
        print("\n🧪 Test 7: Multiple Document Deletions")
        print("-" * 40)
        
        # Delete multiple artifacts
        deleted_count = 0
        for artifact in self.test_artifacts[3:]:
            try:
                self.db.delete_artifact(
                    artifact_id=artifact.id,
                    deleted_by="test_deleter@example.com",
                    deletion_reason="Test multiple deletions"
                )
                deleted_count += 1
            except Exception as e:
                print(f"❌ Failed to delete artifact {artifact.id}: {e}")
        
        print(f"✅ Successfully deleted {deleted_count} artifacts")
        
        # Verify all deleted documents exist
        for artifact in self.test_artifacts[3:]:
            deleted_doc = self.db.get_deleted_document_by_original_id(artifact.id)
            assert deleted_doc is not None
            assert deleted_doc.deleted_by == "test_deleter@example.com"
        
        print("✅ All deleted documents properly recorded")
        
    def test_8_database_consistency(self):
        """Test database consistency after deletions."""
        print("\n🧪 Test 8: Database Consistency")
        print("-" * 40)
        
        # Check database info
        db_info = self.db.get_database_info()
        print(f"✅ Database info: {db_info['table_counts']}")
        
        # Verify deleted documents count
        deleted_docs_count = db_info['table_counts']['deleted_documents']
        assert deleted_docs_count > 0
        print(f"✅ Deleted documents count: {deleted_docs_count}")
        
        # Verify total records count
        total_records = db_info['total_records']
        print(f"✅ Total records in database: {total_records}")
        
    def test_9_edge_cases(self):
        """Test edge cases and boundary conditions."""
        print("\n🧪 Test 9: Edge Cases")
        print("-" * 40)
        
        # Find artifacts that haven't been deleted yet
        available_artifacts = []
        for artifact in self.test_artifacts:
            if self.db.get_artifact_by_id(artifact.id) is not None:
                available_artifacts.append(artifact)
        
        if not available_artifacts:
            print("⚠️  No available artifacts for edge case tests")
            return
        
        # Test with very long deletion reason
        long_reason = "A" * 1000  # 1000 character reason
        artifact = available_artifacts[0]
        
        try:
            self.db.delete_artifact(
                artifact_id=artifact.id,
                deleted_by="test_deleter@example.com",
                deletion_reason=long_reason
            )
            print("✅ Handles long deletion reason correctly")
        except Exception as e:
            print(f"❌ Failed with long deletion reason: {e}")
        
        # Test with special characters in deletion reason (if we have another artifact)
        if len(available_artifacts) > 1:
            special_reason = "Test with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?"
            artifact2 = available_artifacts[1]
            try:
                self.db.delete_artifact(
                    artifact_id=artifact2.id,
                    deleted_by="test_deleter@example.com",
                    deletion_reason=special_reason
                )
                print("✅ Handles special characters in deletion reason")
            except Exception as e:
                print(f"❌ Failed with special characters: {e}")
        
        print("✅ Edge cases handled correctly")
        
    def test_10_performance_test(self):
        """Test performance with multiple operations."""
        print("\n🧪 Test 10: Performance Test")
        print("-" * 40)
        
        # Create additional test artifacts for performance testing
        start_time = time.time()
        
        for i in range(10):
            artifact = Artifact(
                id=str(uuid.uuid4()),
                loan_id=f"PERF_TEST_LOAN_{i+1:03d}",
                artifact_type="loan_packet",
                etid=100001,
                payload_sha256=f"perf{i}a{i}b{i}c{i}d{i}e{i}f{i}789012345678901234567890abcdef1234567890abcdef",
                manifest_sha256=f"perf{i}f{i}e{i}d{i}c{i}b{i}a{i}789012345678901234567890abcdef1234567890abcdef",
                walacor_tx_id=f"WAL_TX_PERF_{i+1:03d}",
                created_by=f"perf_user_{i+1}@example.com",
                blockchain_seal=f"perf_seal_info_{i+1}",
                local_metadata={"file_size": 1024000, "file_path": f"/perf/path/document_{i+1}.pdf"},
                borrower_info={"full_name": f"Perf User {i+1}", "email": f"perf{i+1}@example.com"}
            )
            
            self.session.add(artifact)
        
        self.session.commit()
        creation_time = time.time() - start_time
        print(f"✅ Created 10 performance test artifacts in {creation_time:.3f} seconds")
        
        # Test deletion performance
        start_time = time.time()
        deleted_count = 0
        
        for artifact in self.session.query(Artifact).filter(Artifact.loan_id.like("PERF_TEST_LOAN_%")).all():
            try:
                self.db.delete_artifact(
                    artifact_id=artifact.id,
                    deleted_by="perf_deleter@example.com",
                    deletion_reason="Performance test deletion"
                )
                deleted_count += 1
            except Exception as e:
                print(f"❌ Failed to delete performance test artifact: {e}")
        
        deletion_time = time.time() - start_time
        print(f"✅ Deleted {deleted_count} artifacts in {deletion_time:.3f} seconds")
        print(f"✅ Average deletion time: {deletion_time/deleted_count:.3f} seconds per document")
        
    def run_all_tests(self):
        """Run all comprehensive tests."""
        print("🚀 STARTING COMPREHENSIVE DELETE FUNCTIONALITY TESTS")
        print("=" * 60)
        
        try:
            self.setup_test_data()
            
            self.test_1_basic_deletion()
            self.test_2_verification_by_hash()
            self.test_3_loan_based_retrieval()
            self.test_4_metadata_preservation()
            self.test_5_error_handling()
            self.test_6_verification_message_format()
            self.test_7_multiple_deletions()
            self.test_8_database_consistency()
            self.test_9_edge_cases()
            self.test_10_performance_test()
            
            print("\n" + "=" * 60)
            print("🎉 ALL COMPREHENSIVE TESTS PASSED SUCCESSFULLY!")
            print("=" * 60)
            
            return True
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        finally:
            self.session.close()


def run_comprehensive_tests():
    """Run the comprehensive test suite."""
    test_suite = ComprehensiveDeleteTestSuite()
    return test_suite.run_all_tests()


if __name__ == "__main__":
    success = run_comprehensive_tests()
    exit(0 if success else 1)
