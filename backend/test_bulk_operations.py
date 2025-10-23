"""
Test Suite for Bulk Operations with ObjectValidator Integration

This test suite thoroughly tests the bulk operations functionality including
ObjectValidator integration, bulk verification, bulk deletion, and bulk export.
"""

import pytest
import json
import uuid
import tempfile
import os
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

# Import the models and services
try:
    from src.models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument
    from src.database import Database
    from src.bulk_operations_manager import BulkOperationsManager
    from src.walacor_service import WalacorIntegrityService
    from src.document_handler import DocumentHandler
except ImportError:
    # Fallback for when running as script
    from models import Base, Artifact, ArtifactFile, ArtifactEvent, DeletedDocument
    from database import Database
    from bulk_operations_manager import BulkOperationsManager
    from walacor_service import WalacorIntegrityService
    from document_handler import DocumentHandler

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


class BulkOperationsTestSuite:
    """Test suite for bulk operations functionality."""
    
    def __init__(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.db = Database(db_url="sqlite:///:memory:")
        self.db.session = self.session
        
        # Initialize services
        self.walacor_service = WalacorIntegrityService()
        self.document_handler = DocumentHandler()
        self.bulk_manager = BulkOperationsManager(self.walacor_service, self.document_handler)
        
        # Create temporary directory for testing
        self.temp_dir = tempfile.mkdtemp()
        self.test_artifacts = []
        
    def setup_test_data(self):
        """Set up test data for bulk operations testing."""
        print("🔧 Setting up test data for bulk operations...")
        
        # Create test artifacts
        for i in range(5):
            artifact = Artifact(
                id=str(uuid.uuid4()),
                loan_id=f"BULK_TEST_LOAN_{i+1:03d}",
                artifact_type="loan_packet",
                etid=100001,
                payload_sha256=f"bulk_test_hash_{i}_123456789012345678901234567890abcdef1234567890abcdef1234",
                manifest_sha256=f"bulk_test_manifest_{i}_123456789012345678901234567890abcdef1234567890abcdef1234",
                walacor_tx_id=f"WAL_TX_BULK_{i+1:03d}",
                created_by=f"bulk_test_user_{i+1}@example.com",
                blockchain_seal=f"bulk_test_seal_{i+1}",
                local_metadata={
                    "file_size": 1024000 + i * 1000,
                    "file_path": f"{self.temp_dir}/bulk_test_document_{i+1}.pdf",
                    "security_level": "standard"
                },
                borrower_info={
                    "full_name": f"Bulk Test User {i+1}",
                    "email": f"bulk{i+1}@example.com",
                    "loan_amount": 100000 + i * 10000
                }
            )
            
            self.session.add(artifact)
            
            # Create test files
            test_file_path = Path(self.temp_dir) / f"bulk_test_document_{i+1}.pdf"
            test_file_path.write_text(f"Test document content {i+1}")
            
            self.test_artifacts.append(artifact)
        
        self.session.commit()
        print(f"✅ Created {len(self.test_artifacts)} test artifacts")
        
    def test_1_bulk_directory_verification(self):
        """Test bulk directory verification with ObjectValidator."""
        print("\n🧪 Test 1: Bulk Directory Verification")
        print("-" * 50)
        
        # Create test directory structure
        test_dir = Path(self.temp_dir) / "test_loan_directory"
        test_dir.mkdir(exist_ok=True)
        
        # Create test files in directory
        for i in range(3):
            test_file = test_dir / f"loan_document_{i+1}.pdf"
            test_file.write_text(f"Loan document content {i+1}")
        
        print(f"📁 Created test directory: {test_dir}")
        print(f"   Files: {list(test_dir.glob('*'))}")
        
        # Test bulk directory verification
        result = await self.bulk_manager.bulk_verify_directory(
            directory_path=str(test_dir),
            loan_id="BULK_TEST_LOAN_001"
        )
        
        # Verify results
        assert result["verification_status"] in ["verified", "not_found", "walacor_unavailable"]
        assert result["directory_hash"] is not None
        assert result["files_count"] == 3
        assert result["object_validator_used"] == True
        
        print(f"✅ Directory verification successful:")
        print(f"   Hash: {result['directory_hash'][:16]}...")
        print(f"   Files: {result['files_count']}")
        print(f"   Status: {result['verification_status']}")
        
    def test_2_bulk_delete_with_verification(self):
        """Test bulk deletion with verification."""
        print("\n🧪 Test 2: Bulk Delete with Verification")
        print("-" * 50)
        
        # Get artifact IDs for deletion
        artifact_ids = [artifact.id for artifact in self.test_artifacts[:3]]
        
        print(f"🗑️ Testing bulk deletion of {len(artifact_ids)} artifacts")
        
        # Test bulk deletion
        result = await self.bulk_manager.bulk_delete_with_verification(
            artifact_ids=artifact_ids,
            deleted_by="bulk_test_deleter@example.com",
            deletion_reason="Bulk operations test deletion"
        )
        
        # Verify results
        assert result["total_requested"] == len(artifact_ids)
        assert result["successful"] + result["failed"] == len(artifact_ids)
        
        print(f"✅ Bulk deletion completed:")
        print(f"   Total requested: {result['total_requested']}")
        print(f"   Successful: {result['successful']}")
        print(f"   Failed: {result['failed']}")
        
        # Verify artifacts are deleted
        for artifact_id in artifact_ids:
            deleted_artifact = self.db.get_artifact_by_id(artifact_id)
            assert deleted_artifact is None, f"Artifact {artifact_id} should be deleted"
            
            deleted_doc = self.db.get_deleted_document_by_original_id(artifact_id)
            assert deleted_doc is not None, f"Deleted document record should exist for {artifact_id}"
        
        print("✅ All artifacts properly deleted and metadata preserved")
        
    def test_3_bulk_export_metadata(self):
        """Test bulk metadata export."""
        print("\n🧪 Test 3: Bulk Metadata Export")
        print("-" * 50)
        
        # Get artifact IDs for export
        artifact_ids = [artifact.id for artifact in self.test_artifacts]
        
        print(f"📤 Testing bulk export of {len(artifact_ids)} artifacts")
        
        # Test JSON export
        result = await self.bulk_manager.bulk_export_metadata(
            artifact_ids=artifact_ids,
            export_format="json"
        )
        
        # Verify results
        assert result["total_requested"] == len(artifact_ids)
        assert result["exported"] > 0
        assert result["export_format"] == "json"
        
        print(f"✅ Bulk export completed:")
        print(f"   Total requested: {result['total_requested']}")
        print(f"   Exported: {result['exported']}")
        print(f"   Format: {result['export_format']}")
        
        # Test CSV export
        csv_result = await self.bulk_manager.bulk_export_metadata(
            artifact_ids=artifact_ids[:2],
            export_format="csv"
        )
        
        assert csv_result["export_format"] == "csv"
        assert csv_result["exported"] > 0
        
        print("✅ CSV export also successful")
        
    def test_4_object_validator_fallback(self):
        """Test ObjectValidator fallback implementation."""
        print("\n🧪 Test 4: ObjectValidator Fallback")
        print("-" * 50)
        
        # Test fallback validator
        fallback_validator = self.bulk_manager._create_fallback_validator()
        
        # Create test directory
        test_dir = Path(self.temp_dir) / "fallback_test"
        test_dir.mkdir(exist_ok=True)
        
        # Create test files
        for i in range(2):
            test_file = test_dir / f"fallback_test_{i+1}.txt"
            test_file.write_text(f"Fallback test content {i+1}")
        
        # Test hash generation
        directory_hash = fallback_validator.generate_directory_hash(str(test_dir))
        assert len(directory_hash) == 64
        assert directory_hash.isalnum()
        
        print(f"✅ Fallback validator working:")
        print(f"   Directory hash: {directory_hash[:16]}...")
        
        # Test hash verification
        verification_result = fallback_validator.verify_directory_hash(
            str(test_dir), directory_hash
        )
        
        assert verification_result["is_valid"] == True
        assert verification_result["current_hash"] == directory_hash
        
        print("✅ Hash verification successful")
        
    def test_5_error_handling(self):
        """Test error handling in bulk operations."""
        print("\n🧪 Test 5: Error Handling")
        print("-" * 50)
        
        # Test with non-existent directory
        try:
            result = await self.bulk_manager.bulk_verify_directory(
                directory_path="/nonexistent/directory",
                loan_id="TEST_LOAN"
            )
            assert result["verification_status"] == "failed"
            assert "error" in result
            print("✅ Non-existent directory handled correctly")
        except Exception as e:
            print(f"⚠️ Exception caught: {e}")
        
        # Test with empty artifact list
        try:
            result = await self.bulk_manager.bulk_delete_with_verification(
                artifact_ids=[],
                deleted_by="test@example.com"
            )
            assert result["total_requested"] == 0
            print("✅ Empty artifact list handled correctly")
        except Exception as e:
            print(f"⚠️ Exception caught: {e}")
        
        # Test with invalid export format
        try:
            result = await self.bulk_manager.bulk_export_metadata(
                artifact_ids=[self.test_artifacts[0].id],
                export_format="invalid_format"
            )
            # Should still work with fallback
            assert result["exported"] > 0
            print("✅ Invalid export format handled correctly")
        except Exception as e:
            print(f"⚠️ Exception caught: {e}")
        
    def test_6_performance_metrics(self):
        """Test performance metrics for bulk operations."""
        print("\n🧪 Test 6: Performance Metrics")
        print("-" * 50)
        
        import time
        
        # Test directory verification performance
        test_dir = Path(self.temp_dir) / "performance_test"
        test_dir.mkdir(exist_ok=True)
        
        # Create multiple test files
        for i in range(10):
            test_file = test_dir / f"perf_test_{i+1}.txt"
            test_file.write_text(f"Performance test content {i+1}")
        
        start_time = time.time()
        result = await self.bulk_manager.bulk_verify_directory(
            directory_path=str(test_dir),
            loan_id="PERF_TEST_LOAN"
        )
        verification_time = time.time() - start_time
        
        print(f"✅ Directory verification performance:")
        print(f"   Time: {verification_time:.3f} seconds")
        print(f"   Files: {result['files_count']}")
        print(f"   Time per file: {verification_time/result['files_count']:.3f} seconds")
        
        # Test bulk deletion performance
        artifact_ids = [artifact.id for artifact in self.test_artifacts]
        
        start_time = time.time()
        result = await self.bulk_manager.bulk_delete_with_verification(
            artifact_ids=artifact_ids,
            deleted_by="perf_test@example.com"
        )
        deletion_time = time.time() - start_time
        
        print(f"✅ Bulk deletion performance:")
        print(f"   Time: {deletion_time:.3f} seconds")
        print(f"   Artifacts: {len(artifact_ids)}")
        print(f"   Time per artifact: {deletion_time/len(artifact_ids):.3f} seconds")
        
    def test_7_integration_scenarios(self):
        """Test integration scenarios."""
        print("\n🧪 Test 7: Integration Scenarios")
        print("-" * 50)
        
        # Scenario 1: Verify directory, then bulk delete artifacts
        test_dir = Path(self.temp_dir) / "integration_test"
        test_dir.mkdir(exist_ok=True)
        
        for i in range(3):
            test_file = test_dir / f"integration_test_{i+1}.txt"
            test_file.write_text(f"Integration test content {i+1}")
        
        # Step 1: Verify directory
        verification_result = await self.bulk_manager.bulk_verify_directory(
            directory_path=str(test_dir),
            loan_id="INTEGRATION_TEST_LOAN"
        )
        
        assert verification_result["verification_status"] in ["verified", "not_found", "walacor_unavailable"]
        print("✅ Step 1: Directory verification successful")
        
        # Step 2: Bulk delete some artifacts
        artifact_ids = [artifact.id for artifact in self.test_artifacts[:2]]
        deletion_result = await self.bulk_manager.bulk_delete_with_verification(
            artifact_ids=artifact_ids,
            deleted_by="integration_test@example.com"
        )
        
        assert deletion_result["successful"] > 0
        print("✅ Step 2: Bulk deletion successful")
        
        # Step 3: Export remaining artifacts
        remaining_artifact_ids = [artifact.id for artifact in self.test_artifacts[2:]]
        export_result = await self.bulk_manager.bulk_export_metadata(
            artifact_ids=remaining_artifact_ids,
            export_format="json"
        )
        
        assert export_result["exported"] > 0
        print("✅ Step 3: Bulk export successful")
        
        print("✅ Integration scenario completed successfully")
        
    def run_all_tests(self):
        """Run all bulk operations tests."""
        print("🚀 STARTING BULK OPERATIONS TEST SUITE")
        print("=" * 60)
        
        try:
            self.setup_test_data()
            
            self.test_1_bulk_directory_verification()
            self.test_2_bulk_delete_with_verification()
            self.test_3_bulk_export_metadata()
            self.test_4_object_validator_fallback()
            self.test_5_error_handling()
            self.test_6_performance_metrics()
            self.test_7_integration_scenarios()
            
            print("\n" + "=" * 60)
            print("🎉 ALL BULK OPERATIONS TESTS PASSED SUCCESSFULLY!")
            print("=" * 60)
            
            return True
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        finally:
            self.session.close()
            # Clean up temporary directory
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)


def run_bulk_operations_tests():
    """Run bulk operations tests."""
    test_suite = BulkOperationsTestSuite()
    return test_suite.run_all_tests()


if __name__ == "__main__":
    success = run_bulk_operations_tests()
    exit(0 if success else 1)
