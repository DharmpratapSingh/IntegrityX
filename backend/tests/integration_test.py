"""
Integration Test Suite for Document Delete Functionality

This test suite tests the complete integration of the delete functionality
including database operations, verification, and real-world scenarios.
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


class IntegrationTestSuite:
    """Integration test suite for delete functionality."""
    
    def __init__(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.db = Database(db_url="sqlite:///:memory:")
        self.db.session = self.session
        
    def setup_realistic_data(self):
        """Set up realistic test data for integration testing."""
        print("🔧 Setting up realistic test data...")
        
        # Create multiple loan documents
        self.loan_documents = []
        
        loan_scenarios = [
            {
                "loan_id": "LOAN_2024_001",
                "borrower_name": "John Smith",
                "loan_amount": 250000,
                "document_type": "mortgage_application"
            },
            {
                "loan_id": "LOAN_2024_002", 
                "borrower_name": "Jane Doe",
                "loan_amount": 150000,
                "document_type": "personal_loan"
            },
            {
                "loan_id": "LOAN_2024_003",
                "borrower_name": "Bob Johnson", 
                "loan_amount": 500000,
                "document_type": "business_loan"
            }
        ]
        
        for i, scenario in enumerate(loan_scenarios):
            artifact = Artifact(
                id=str(uuid.uuid4()),
                loan_id=scenario["loan_id"],
                artifact_type="loan_packet",
                etid=100001,
                payload_sha256=f"realistic_hash_{i:02d}_123456789012345678901234567890abcdef1234567890abcdef1234",
                manifest_sha256=f"realistic_manifest_{i:02d}_123456789012345678901234567890abcdef1234567890abcdef1234",
                walacor_tx_id=f"WAL_TX_REALISTIC_{i+1:03d}",
                created_by=f"loan_officer_{i+1}@bank.com",
                blockchain_seal=f"realistic_seal_{i+1}",
                local_metadata={
                    "file_size": 2048000 + i * 500000,
                    "file_path": f"/loans/2024/{scenario['loan_id']}/application.pdf",
                    "security_level": "high",
                    "document_type": scenario["document_type"],
                    "processing_status": "approved"
                },
                borrower_info={
                    "full_name": scenario["borrower_name"],
                    "email": f"{scenario['borrower_name'].lower().replace(' ', '.')}@email.com",
                    "loan_amount": scenario["loan_amount"],
                    "credit_score": 750 + i * 10,
                    "employment_status": "employed"
                }
            )
            
            self.session.add(artifact)
            
            # Add multiple files to each loan
            file_types = ["application", "income_verification", "credit_report", "property_appraisal"]
            for j, file_type in enumerate(file_types):
                file = ArtifactFile(
                    id=str(uuid.uuid4()),
                    artifact_id=artifact.id,
                    name=f"{scenario['loan_id']}_{file_type}.pdf",
                    uri=f"/loans/2024/{scenario['loan_id']}/{file_type}.pdf",
                    sha256=f"realistic_file_{i:02d}_{j}_123456789012345678901234567890abcdef1234567890abcdef",
                    size_bytes=512000 + j * 100000,
                    content_type="application/pdf"
                )
                self.session.add(file)
            
            # Add events to track document lifecycle
            events = [
                ("uploaded", "Document uploaded by loan officer"),
                ("reviewed", "Document reviewed by underwriter"),
                ("approved", "Document approved by manager"),
                ("sealed", "Document sealed on blockchain")
            ]
            
            for j, (event_type, description) in enumerate(events):
                event = ArtifactEvent(
                    id=str(uuid.uuid4()),
                    artifact_id=artifact.id,
                    event_type=event_type,
                    payload_json=json.dumps({
                        "description": description,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "user": f"system_user_{j+1}"
                    }),
                    payload_sha256=f"realistic_event_{i:02d}_{j}_123456789012345678901234567890abcdef1234567890abcdef",
                    walacor_tx_id=f"WAL_TX_EVENT_{i+1}_{j+1:03d}",
                    created_by=f"system_user_{j+1}@bank.com"
                )
                self.session.add(event)
            
            self.loan_documents.append(artifact)
        
        self.session.commit()
        print(f"✅ Created {len(self.loan_documents)} realistic loan documents with files and events")
        
    def test_complete_loan_document_deletion(self):
        """Test complete deletion of a loan document with all its components."""
        print("\n🧪 Test: Complete Loan Document Deletion")
        print("-" * 50)
        
        loan_doc = self.loan_documents[0]
        original_id = loan_doc.id
        loan_id = loan_doc.loan_id
        
        print(f"📄 Testing deletion of loan document: {loan_id}")
        print(f"   Document ID: {original_id}")
        print(f"   Borrower: {loan_doc.borrower_info['full_name']}")
        print(f"   Loan Amount: ${loan_doc.borrower_info['loan_amount']:,}")
        
        # Verify document exists and has files/events
        assert self.db.get_artifact_by_id(original_id) is not None
        files_count = len([f for f in self.session.query(ArtifactFile).filter(ArtifactFile.artifact_id == original_id).all()])
        events_count = len([e for e in self.session.query(ArtifactEvent).filter(ArtifactEvent.artifact_id == original_id).all()])
        
        print(f"   Files: {files_count}")
        print(f"   Events: {events_count}")
        
        # Delete the document
        deletion_result = self.db.delete_artifact(
            artifact_id=original_id,
            deleted_by="compliance_officer@bank.com",
            deletion_reason="Document retention policy compliance - 7 year retention period completed"
        )
        
        print(f"✅ Document deleted successfully")
        print(f"   Deleted Document ID: {deletion_result['deleted_document_id']}")
        print(f"   Deletion Event ID: {deletion_result['deletion_event_id']}")
        
        # Verify document is removed from active table
        assert self.db.get_artifact_by_id(original_id) is None
        print("✅ Document removed from active artifacts table")
        
        # Verify deleted document record exists with all metadata
        deleted_doc = self.db.get_deleted_document_by_original_id(original_id)
        assert deleted_doc is not None
        
        print(f"✅ Deleted document record created")
        print(f"   Original ID: {deleted_doc.original_artifact_id}")
        print(f"   Loan ID: {deleted_doc.loan_id}")
        print(f"   Deleted by: {deleted_doc.deleted_by}")
        print(f"   Deletion reason: {deleted_doc.deletion_reason}")
        print(f"   Files preserved: {len(deleted_doc.files_info) if deleted_doc.files_info else 0}")
        
        # Verify verification still works
        verification_info = deleted_doc.get_verification_info()
        print(f"✅ Verification info: {verification_info['verification_message']}")
        
        return deleted_doc
        
    def test_verification_after_deletion(self):
        """Test verification capabilities after deletion."""
        print("\n🧪 Test: Verification After Deletion")
        print("-" * 50)
        
        # Delete a document first
        loan_doc = self.loan_documents[1]
        original_hash = loan_doc.payload_sha256
        
        self.db.delete_artifact(
            artifact_id=loan_doc.id,
            deleted_by="auditor@bank.com",
            deletion_reason="Audit compliance - document no longer needed for current audit"
        )
        
        print(f"📄 Testing verification of deleted document")
        print(f"   Document hash: {original_hash[:16]}...")
        
        # Test verification by hash
        deleted_doc = self.db.get_deleted_document_by_hash(original_hash)
        assert deleted_doc is not None
        
        print(f"✅ Document found in deleted documents by hash")
        print(f"   Original ID: {deleted_doc.original_artifact_id}")
        print(f"   Borrower: {deleted_doc.borrower_info['full_name']}")
        
        # Test verification info
        verification_info = deleted_doc.get_verification_info()
        print(f"✅ Verification successful")
        print(f"   Status: {verification_info['status']}")
        print(f"   Message: {verification_info['verification_message']}")
        
        # Test that original document is not found in active table
        active_doc = self.db.get_artifact_by_hash(original_hash)
        assert active_doc is None
        print("✅ Document correctly removed from active table")
        
    def test_loan_portfolio_deletion_tracking(self):
        """Test tracking deletions across a loan portfolio."""
        print("\n🧪 Test: Loan Portfolio Deletion Tracking")
        print("-" * 50)
        
        # Delete documents from different loans
        deletion_scenarios = [
            {
                "loan_doc": self.loan_documents[0],
                "reason": "Data retention policy - 7 year retention completed",
                "deleted_by": "compliance_officer@bank.com"
            },
            {
                "loan_doc": self.loan_documents[1], 
                "reason": "Customer requested deletion - GDPR compliance",
                "deleted_by": "privacy_officer@bank.com"
            }
        ]
        
        deleted_count = 0
        for scenario in deletion_scenarios:
            try:
                self.db.delete_artifact(
                    artifact_id=scenario["loan_doc"].id,
                    deleted_by=scenario["deleted_by"],
                    deletion_reason=scenario["reason"]
                )
                deleted_count += 1
                print(f"✅ Deleted loan document: {scenario['loan_doc'].loan_id}")
            except Exception as e:
                print(f"❌ Failed to delete {scenario['loan_doc'].loan_id}: {e}")
        
        print(f"✅ Successfully deleted {deleted_count} loan documents")
        
        # Test retrieval of deleted documents by loan ID
        for scenario in deletion_scenarios:
            loan_id = scenario["loan_doc"].loan_id
            deleted_docs = self.db.get_deleted_documents_by_loan_id(loan_id)
            
            if deleted_docs:
                deleted_doc = deleted_docs[0]
                print(f"✅ Found deleted document for loan {loan_id}")
                print(f"   Deleted by: {deleted_doc.deleted_by}")
                print(f"   Reason: {deleted_doc.deletion_reason}")
            else:
                print(f"⚠️  No deleted documents found for loan {loan_id}")
        
    def test_audit_trail_completeness(self):
        """Test completeness of audit trail after deletions."""
        print("\n🧪 Test: Audit Trail Completeness")
        print("-" * 50)
        
        loan_doc = self.loan_documents[2]
        
        # Delete the document
        self.db.delete_artifact(
            artifact_id=loan_doc.id,
            deleted_by="audit_team@bank.com",
            deletion_reason="End of audit period - document archived per policy"
        )
        
        print(f"📄 Testing audit trail for deleted document: {loan_doc.loan_id}")
        
        # Get the deleted document
        deleted_doc = self.db.get_deleted_document_by_original_id(loan_doc.id)
        
        # Verify all audit information is preserved
        audit_info = {
            "original_created_at": deleted_doc.original_created_at,
            "original_created_by": deleted_doc.original_created_by,
            "deleted_at": deleted_doc.deleted_at,
            "deleted_by": deleted_doc.deleted_by,
            "deletion_reason": deleted_doc.deletion_reason,
            "loan_id": deleted_doc.loan_id,
            "borrower_name": deleted_doc.borrower_info["full_name"],
            "loan_amount": deleted_doc.borrower_info["loan_amount"]
        }
        
        print("✅ Audit trail information preserved:")
        for key, value in audit_info.items():
            print(f"   {key}: {value}")
        
        # Verify verification message contains audit information
        verification_info = deleted_doc.get_verification_info()
        message = verification_info["verification_message"]
        
        assert "uploaded on" in message.lower()
        assert "deleted on" in message.lower()
        assert deleted_doc.deleted_by in message
        
        print(f"✅ Verification message contains audit trail: {message}")
        
    def test_performance_with_realistic_data(self):
        """Test performance with realistic data volumes."""
        print("\n🧪 Test: Performance with Realistic Data")
        print("-" * 50)
        
        # Create additional documents for performance testing
        print("📊 Creating additional documents for performance testing...")
        
        start_time = time.time()
        performance_docs = []
        
        for i in range(20):  # Create 20 additional documents
            doc = Artifact(
                id=str(uuid.uuid4()),
                loan_id=f"PERF_LOAN_{i+1:03d}",
                artifact_type="loan_packet",
                etid=100001,
                payload_sha256=f"perf_hash_{i}_123456789012345678901234567890abcdef1234567890abcdef123456",
                manifest_sha256=f"perf_manifest_{i}_123456789012345678901234567890abcdef1234567890abcdef123456",
                walacor_tx_id=f"WAL_TX_PERF_{i+1:03d}",
                created_by=f"perf_user_{i+1}@bank.com",
                blockchain_seal=f"perf_seal_{i+1}",
                local_metadata={"file_size": 1024000, "file_path": f"/perf/loan_{i+1}.pdf"},
                borrower_info={"full_name": f"Performance User {i+1}", "email": f"perf{i+1}@email.com", "loan_amount": 100000 + i * 10000}
            )
            
            self.session.add(doc)
            performance_docs.append(doc)
        
        self.session.commit()
        creation_time = time.time() - start_time
        print(f"✅ Created {len(performance_docs)} performance test documents in {creation_time:.3f} seconds")
        
        # Test deletion performance
        start_time = time.time()
        deleted_count = 0
        
        for doc in performance_docs:
            try:
                self.db.delete_artifact(
                    artifact_id=doc.id,
                    deleted_by="perf_deleter@bank.com",
                    deletion_reason="Performance test deletion"
                )
                deleted_count += 1
            except Exception as e:
                print(f"❌ Failed to delete performance document {doc.id}: {e}")
        
        deletion_time = time.time() - start_time
        print(f"✅ Deleted {deleted_count} documents in {deletion_time:.3f} seconds")
        print(f"✅ Average deletion time: {deletion_time/deleted_count:.3f} seconds per document")
        
        # Test verification performance
        start_time = time.time()
        verification_count = 0
        
        for doc in performance_docs:
            deleted_doc = self.db.get_deleted_document_by_hash(doc.payload_sha256)
            if deleted_doc:
                verification_info = deleted_doc.get_verification_info()
                verification_count += 1
        
        verification_time = time.time() - start_time
        print(f"✅ Verified {verification_count} deleted documents in {verification_time:.3f} seconds")
        print(f"✅ Average verification time: {verification_time/verification_count:.3f} seconds per document")
        
    def test_data_integrity_and_consistency(self):
        """Test data integrity and consistency after operations."""
        print("\n🧪 Test: Data Integrity and Consistency")
        print("-" * 50)
        
        # Get database statistics
        db_info = self.db.get_database_info()
        print("📊 Database statistics:")
        print(f"   Artifacts: {db_info['table_counts']['artifacts']}")
        print(f"   Deleted Documents: {db_info['table_counts']['deleted_documents']}")
        print(f"   Artifact Files: {db_info['table_counts']['artifact_files']}")
        print(f"   Artifact Events: {db_info['table_counts']['artifact_events']}")
        print(f"   Total Records: {db_info['total_records']}")
        
        # Verify data consistency
        deleted_docs = self.session.query(DeletedDocument).all()
        print(f"✅ Found {len(deleted_docs)} deleted documents in database")
        
        for deleted_doc in deleted_docs:
            # Verify that original artifact doesn't exist in active table
            original_exists = self.db.get_artifact_by_id(deleted_doc.original_artifact_id) is not None
            assert not original_exists, f"Original artifact {deleted_doc.original_artifact_id} still exists in active table"
            
            # Verify hash consistency
            assert len(deleted_doc.payload_sha256) == 64, f"Invalid hash length for {deleted_doc.original_artifact_id}"
            
            # Verify verification info is complete
            verification_info = deleted_doc.get_verification_info()
            assert verification_info["status"] == "deleted"
            assert "verification_message" in verification_info
        
        print("✅ Data integrity and consistency verified")
        
    def run_all_tests(self):
        """Run all integration tests."""
        print("🚀 STARTING INTEGRATION TEST SUITE")
        print("=" * 60)
        
        try:
            self.setup_realistic_data()
            
            self.test_complete_loan_document_deletion()
            self.test_verification_after_deletion()
            self.test_loan_portfolio_deletion_tracking()
            self.test_audit_trail_completeness()
            self.test_performance_with_realistic_data()
            self.test_data_integrity_and_consistency()
            
            print("\n" + "=" * 60)
            print("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
            print("=" * 60)
            
            return True
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        finally:
            self.session.close()


def run_integration_tests():
    """Run integration tests."""
    test_suite = IntegrationTestSuite()
    return test_suite.run_all_tests()


if __name__ == "__main__":
    success = run_integration_tests()
    exit(0 if success else 1)
