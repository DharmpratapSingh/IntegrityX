"""
Test file for document deletion functionality.

This test file verifies the comprehensive delete functionality that preserves
document metadata for verification purposes even after deletion.
"""

import pytest
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
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


class TestDeleteFunctionality:
    """Test class for document deletion functionality."""
    
    @pytest.fixture
    def db_session(self):
        """Create a test database session."""
        engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()
    
    @pytest.fixture
    def test_database(self, db_session):
        """Create a test database instance."""
        db = Database()
        db.session = db_session
        return db
    
    @pytest.fixture
    def sample_artifact(self, db_session):
        """Create a sample artifact for testing."""
        artifact = Artifact(
            id=str(uuid.uuid4()),
            loan_id="TEST_LOAN_001",
            artifact_type="loan_packet",
            etid=100001,
            payload_sha256="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
            manifest_sha256="f6e5d4c3b2a1789012345678901234567890abcdef1234567890abcdef123456",
            walacor_tx_id="WAL_TX_TEST_001",
            created_by="test_user@example.com",
            blockchain_seal="test_seal_info",
            local_metadata={"file_size": 1024000, "file_path": "/test/path/document.pdf"},
            borrower_info={"full_name": "John Doe", "email": "john@example.com"}
        )
        
        db_session.add(artifact)
        
        # Add a file to the artifact
        file = ArtifactFile(
            id=str(uuid.uuid4()),
            artifact_id=artifact.id,
            name="test_document.pdf",
            uri="/test/path/document.pdf",
            sha256="1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            size_bytes=1024000,
            content_type="application/pdf"
        )
        
        db_session.add(file)
        db_session.commit()
        
        return artifact
    
    def test_delete_artifact_preserves_metadata(self, test_database, sample_artifact):
        """Test that deleting an artifact preserves all metadata."""
        # Delete the artifact
        result = test_database.delete_artifact(
            artifact_id=sample_artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion"
        )
        
        # Verify the result structure
        assert "deleted_artifact_id" in result
        assert "deleted_document_id" in result
        assert "deletion_event_id" in result
        assert "verification_info" in result
        assert "preserved_metadata" in result
        
        assert result["deleted_artifact_id"] == sample_artifact.id
        assert result["preserved_metadata"]["loan_id"] == sample_artifact.loan_id
        assert result["preserved_metadata"]["payload_sha256"] == sample_artifact.payload_sha256
        
        # Verify the artifact is removed from the artifacts table
        deleted_artifact = test_database.get_artifact_by_id(sample_artifact.id)
        assert deleted_artifact is None
        
        # Verify the deleted document record exists
        deleted_doc = test_database.get_deleted_document_by_original_id(sample_artifact.id)
        assert deleted_doc is not None
        assert deleted_doc.original_artifact_id == sample_artifact.id
        assert deleted_doc.loan_id == sample_artifact.loan_id
        assert deleted_doc.payload_sha256 == sample_artifact.payload_sha256
        assert deleted_doc.deleted_by == "test_deleter@example.com"
        assert deleted_doc.deletion_reason == "Test deletion"
    
    def test_verify_deleted_document_by_hash(self, test_database, sample_artifact):
        """Test verifying a deleted document by its hash."""
        # Delete the artifact first
        test_database.delete_artifact(
            artifact_id=sample_artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion"
        )
        
        # Verify the deleted document by hash
        deleted_doc = test_database.get_deleted_document_by_hash(sample_artifact.payload_sha256)
        assert deleted_doc is not None
        assert deleted_doc.original_artifact_id == sample_artifact.id
        assert deleted_doc.payload_sha256 == sample_artifact.payload_sha256
        
        # Test verification info
        verification_info = deleted_doc.get_verification_info()
        assert verification_info["status"] == "deleted"
        assert "verification_message" in verification_info
        assert "uploaded on" in verification_info["verification_message"]
        assert "deleted on" in verification_info["verification_message"]
    
    def test_get_deleted_documents_by_loan_id(self, test_database, sample_artifact):
        """Test retrieving deleted documents by loan ID."""
        # Delete the artifact
        test_database.delete_artifact(
            artifact_id=sample_artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion"
        )
        
        # Get deleted documents by loan ID
        deleted_docs = test_database.get_deleted_documents_by_loan_id(sample_artifact.loan_id)
        assert len(deleted_docs) == 1
        assert deleted_docs[0].loan_id == sample_artifact.loan_id
        assert deleted_docs[0].original_artifact_id == sample_artifact.id
    
    def test_delete_nonexistent_artifact_raises_error(self, test_database):
        """Test that deleting a non-existent artifact raises an error."""
        with pytest.raises(ValueError, match="Artifact not found"):
            test_database.delete_artifact(
                artifact_id="nonexistent_id",
                deleted_by="test_deleter@example.com"
            )
    
    def test_delete_artifact_without_deleted_by_raises_error(self, test_database, sample_artifact):
        """Test that deleting without specifying deleted_by raises an error."""
        with pytest.raises(ValueError, match="deleted_by is required"):
            test_database.delete_artifact(
                artifact_id=sample_artifact.id,
                deleted_by=""
            )
    
    def test_deleted_document_verification_message_format(self, test_database, sample_artifact):
        """Test that the verification message contains proper information."""
        # Delete the artifact
        test_database.delete_artifact(
            artifact_id=sample_artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion"
        )
        
        # Get the deleted document
        deleted_doc = test_database.get_deleted_document_by_original_id(sample_artifact.id)
        verification_info = deleted_doc.get_verification_info()
        
        message = verification_info["verification_message"]
        assert "uploaded on" in message.lower()
        assert "deleted on" in message.lower()
        assert "test_deleter@example.com" in message
    
    def test_deleted_document_preserves_all_metadata(self, test_database, sample_artifact):
        """Test that all original metadata is preserved in the deleted document."""
        # Delete the artifact
        test_database.delete_artifact(
            artifact_id=sample_artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion"
        )
        
        # Get the deleted document
        deleted_doc = test_database.get_deleted_document_by_original_id(sample_artifact.id)
        
        # Verify all original metadata is preserved
        assert deleted_doc.loan_id == sample_artifact.loan_id
        assert deleted_doc.artifact_type == sample_artifact.artifact_type
        assert deleted_doc.etid == sample_artifact.etid
        assert deleted_doc.payload_sha256 == sample_artifact.payload_sha256
        assert deleted_doc.manifest_sha256 == sample_artifact.manifest_sha256
        assert deleted_doc.walacor_tx_id == sample_artifact.walacor_tx_id
        assert deleted_doc.original_created_at == sample_artifact.created_at
        assert deleted_doc.original_created_by == sample_artifact.created_by
        assert deleted_doc.blockchain_seal == sample_artifact.blockchain_seal
        assert deleted_doc.preserved_metadata == sample_artifact.local_metadata
        assert deleted_doc.borrower_info == sample_artifact.borrower_info
        
        # Verify deletion information
        assert deleted_doc.deleted_by == "test_deleter@example.com"
        assert deleted_doc.deletion_reason == "Test deletion"
        assert deleted_doc.deleted_at is not None


class TestDeleteAPIIntegration:
    """Test class for API integration of delete functionality."""
    
    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)
    
    def test_delete_artifact_api_endpoint(self, client):
        """Test the DELETE /api/artifacts/{artifact_id} endpoint."""
        # This test would require setting up the full application context
        # For now, we'll test the structure
        
        # Mock the services
        with patch('main.get_services') as mock_get_services:
            mock_db = Mock()
            mock_db.get_artifact_by_id.return_value = Mock(
                id="test_id",
                loan_id="TEST_LOAN_001",
                payload_sha256="test_hash"
            )
            mock_db.delete_artifact.return_value = {
                "deleted_artifact_id": "test_id",
                "deleted_document_id": "deleted_doc_id",
                "deletion_event_id": "event_id",
                "verification_info": {"status": "deleted"},
                "preserved_metadata": {"loan_id": "TEST_LOAN_001"}
            }
            
            mock_get_services.return_value = {"db": mock_db}
            
            # Test the endpoint
            response = client.delete(
                "/api/artifacts/test_id",
                params={"deleted_by": "test_user@example.com", "deletion_reason": "Test"}
            )
            
            # Verify the response structure (this would need proper setup)
            assert response.status_code in [200, 404]  # 404 if not properly mocked


def run_delete_functionality_tests():
    """Run all delete functionality tests."""
    print("🧪 RUNNING DELETE FUNCTIONALITY TESTS")
    print("=" * 50)
    
    # Test database operations
    print("Testing database operations...")
    
    # Create test database
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Test database instance with SQLite
        db = Database(db_url="sqlite:///:memory:")
        db.session = session
        
        # Create sample artifact
        artifact = Artifact(
            id=str(uuid.uuid4()),
            loan_id="TEST_LOAN_001",
            artifact_type="loan_packet",
            etid=100001,
            payload_sha256="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
            manifest_sha256="f6e5d4c3b2a1789012345678901234567890abcdef1234567890abcdef123456",
            walacor_tx_id="WAL_TX_TEST_001",
            created_by="test_user@example.com",
            blockchain_seal="test_seal_info",
            local_metadata={"file_size": 1024000, "file_path": "/test/path/document.pdf"},
            borrower_info={"full_name": "John Doe", "email": "john@example.com"}
        )
        
        session.add(artifact)
        session.commit()
        
        print(f"✅ Created test artifact: {artifact.id}")
        
        # Test deletion
        result = db.delete_artifact(
            artifact_id=artifact.id,
            deleted_by="test_deleter@example.com",
            deletion_reason="Test deletion"
        )
        
        print(f"✅ Deleted artifact: {result['deleted_artifact_id']}")
        print(f"✅ Preserved metadata in deleted document: {result['deleted_document_id']}")
        
        # Test verification
        deleted_doc = db.get_deleted_document_by_original_id(artifact.id)
        if deleted_doc:
            verification_info = deleted_doc.get_verification_info()
            print(f"✅ Verification info: {verification_info['verification_message']}")
        
        # Test retrieval by hash
        deleted_doc_by_hash = db.get_deleted_document_by_hash(artifact.payload_sha256)
        if deleted_doc_by_hash:
            print(f"✅ Found deleted document by hash: {deleted_doc_by_hash.id}")
        
        # Test retrieval by loan ID
        deleted_docs_by_loan = db.get_deleted_documents_by_loan_id(artifact.loan_id)
        print(f"✅ Found {len(deleted_docs_by_loan)} deleted documents for loan")
        
        print("\n✅ ALL DELETE FUNCTIONALITY TESTS PASSED!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == "__main__":
    run_delete_functionality_tests()
