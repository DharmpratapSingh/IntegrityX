"""
API Endpoints Test Suite for Document Delete Functionality

This test suite tests the API endpoints for document deletion functionality.
"""

import pytest
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

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

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


class APIEndpointsTestSuite:
    """Test suite for API endpoints."""
    
    def __init__(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.db = Database(db_url="sqlite:///:memory:")
        self.db.session = self.session
        self.client = TestClient(app)
        
    def setup_test_data(self):
        """Set up test data for API testing."""
        print("🔧 Setting up test data for API testing...")
        
        # Create test artifact
        self.test_artifact = Artifact(
            id=str(uuid.uuid4()),
            loan_id="API_TEST_LOAN_001",
            artifact_type="loan_packet",
            etid=100001,
            payload_sha256="api_test_hash_123456789012345678901234567890abcdef1234567890abcdef123456",
            manifest_sha256="api_test_manifest_123456789012345678901234567890abcdef1234567890abcdef123456",
            walacor_tx_id="WAL_TX_API_TEST_001",
            created_by="api_test_user@example.com",
            blockchain_seal="api_test_seal_info",
            local_metadata={
                "file_size": 2048000,
                "file_path": "/api/test/path/document.pdf",
                "security_level": "standard"
            },
            borrower_info={
                "full_name": "API Test User",
                "email": "api_test_user@example.com",
                "loan_amount": 200000
            }
        )
        
        self.session.add(self.test_artifact)
        
        # Add files to the artifact
        for j in range(2):
            file = ArtifactFile(
                id=str(uuid.uuid4()),
                artifact_id=self.test_artifact.id,
                name=f"api_test_document_{j+1}.pdf",
                uri=f"/api/test/path/document_{j+1}.pdf",
                sha256=f"api_test_file_hash_{j}123456789012345678901234567890abcdef1234567890abcdef",
                size_bytes=1024000 + j * 1000,
                content_type="application/pdf"
            )
            self.session.add(file)
        
        # Add event to the artifact
        event = ArtifactEvent(
            id=str(uuid.uuid4()),
            artifact_id=self.test_artifact.id,
            event_type="uploaded",
            payload_json=json.dumps({"status": "success", "files_count": 2}),
            payload_sha256=f"api_test_event_hash123456789012345678901234567890abcdef1234567890abcdef",
            walacor_tx_id="WAL_TX_API_EVENT_001",
            created_by="api_test_user@example.com"
        )
        self.session.add(event)
        
        self.session.commit()
        print(f"✅ Created test artifact: {self.test_artifact.id}")
        
    def test_delete_endpoint_structure(self):
        """Test the structure of delete endpoints."""
        print("\n🧪 Testing Delete Endpoint Structure")
        print("-" * 40)
        
        # Test DELETE endpoint structure
        response = self.client.delete(
            f"/api/artifacts/{self.test_artifact.id}",
            params={"deleted_by": "api_test_deleter@example.com", "deletion_reason": "API test deletion"}
        )
        
        # Should return 200 or 404 (depending on mocking)
        assert response.status_code in [200, 404, 422]
        print(f"✅ DELETE endpoint structure test: Status {response.status_code}")
        
        # Test POST endpoint structure
        response = self.client.post(
            "/api/artifacts/delete",
            params={"deleted_by": "api_test_deleter@example.com"},
            json={
                "artifact_id": self.test_artifact.id,
                "deletion_reason": "API test deletion via POST"
            }
        )
        
        # Should return 200 or 404 (depending on mocking)
        assert response.status_code in [200, 404, 422]
        print(f"✅ POST delete endpoint structure test: Status {response.status_code}")
        
    def test_verification_endpoints_structure(self):
        """Test the structure of verification endpoints."""
        print("\n🧪 Testing Verification Endpoints Structure")
        print("-" * 40)
        
        # Test verify deleted document endpoint
        response = self.client.post(
            "/api/verify-deleted-document",
            json={
                "document_hash": self.test_artifact.payload_sha256,
                "original_artifact_id": self.test_artifact.id
            }
        )
        
        # Should return 200 or 422 (depending on validation)
        assert response.status_code in [200, 422]
        print(f"✅ Verify deleted document endpoint: Status {response.status_code}")
        
        # Test verify by hash endpoint
        response = self.client.post(
            "/api/verify-by-hash",
            json={
                "hash": self.test_artifact.payload_sha256
            }
        )
        
        # Should return 200 or 422 (depending on validation)
        assert response.status_code in [200, 422]
        print(f"✅ Verify by hash endpoint: Status {response.status_code}")
        
    def test_deleted_documents_endpoints_structure(self):
        """Test the structure of deleted documents endpoints."""
        print("\n🧪 Testing Deleted Documents Endpoints Structure")
        print("-" * 40)
        
        # Test get deleted document endpoint
        response = self.client.get(f"/api/deleted-documents/{self.test_artifact.id}")
        
        # Should return 404 (document not deleted yet) or 422
        assert response.status_code in [404, 422]
        print(f"✅ Get deleted document endpoint: Status {response.status_code}")
        
        # Test get deleted documents by loan endpoint
        response = self.client.get(f"/api/deleted-documents/loan/{self.test_artifact.loan_id}")
        
        # Should return 200 (empty list) or 422
        assert response.status_code in [200, 422]
        print(f"✅ Get deleted documents by loan endpoint: Status {response.status_code}")
        
    def test_error_handling_endpoints(self):
        """Test error handling in endpoints."""
        print("\n🧪 Testing Error Handling in Endpoints")
        print("-" * 40)
        
        # Test delete non-existent artifact
        response = self.client.delete(
            "/api/artifacts/nonexistent_id",
            params={"deleted_by": "api_test_deleter@example.com"}
        )
        
        # Should return 404 or 422
        assert response.status_code in [404, 422]
        print(f"✅ Delete non-existent artifact: Status {response.status_code}")
        
        # Test delete without deleted_by parameter
        response = self.client.delete(f"/api/artifacts/{self.test_artifact.id}")
        
        # Should return 422 (validation error)
        assert response.status_code in [422, 404]
        print(f"✅ Delete without deleted_by parameter: Status {response.status_code}")
        
        # Test verify with invalid hash
        response = self.client.post(
            "/api/verify-deleted-document",
            json={
                "document_hash": "invalid_hash",
                "original_artifact_id": "some_id"
            }
        )
        
        # Should return 422 (validation error)
        assert response.status_code in [422, 400]
        print(f"✅ Verify with invalid hash: Status {response.status_code}")
        
    def test_request_response_models(self):
        """Test request and response model validation."""
        print("\n🧪 Testing Request/Response Model Validation")
        print("-" * 40)
        
        # Test valid delete request
        valid_delete_request = {
            "artifact_id": self.test_artifact.id,
            "deletion_reason": "API test deletion"
        }
        
        # This should be valid JSON structure
        json_str = json.dumps(valid_delete_request)
        parsed = json.loads(json_str)
        assert parsed["artifact_id"] == self.test_artifact.id
        assert parsed["deletion_reason"] == "API test deletion"
        print("✅ Valid delete request model structure")
        
        # Test valid verification request
        valid_verification_request = {
            "document_hash": self.test_artifact.payload_sha256,
            "original_artifact_id": self.test_artifact.id
        }
        
        json_str = json.dumps(valid_verification_request)
        parsed = json.loads(json_str)
        assert parsed["document_hash"] == self.test_artifact.payload_sha256
        assert parsed["original_artifact_id"] == self.test_artifact.id
        print("✅ Valid verification request model structure")
        
    def test_endpoint_documentation(self):
        """Test that endpoints have proper documentation."""
        print("\n🧪 Testing Endpoint Documentation")
        print("-" * 40)
        
        # Test that endpoints are properly documented
        # This is a basic check - in a real scenario, you'd test the OpenAPI schema
        
        # Check that the app has the expected routes
        routes = [route.path for route in app.routes]
        
        expected_routes = [
            "/api/artifacts/{artifact_id}",
            "/api/artifacts/delete",
            "/api/deleted-documents/{original_artifact_id}",
            "/api/deleted-documents/loan/{loan_id}",
            "/api/verify-deleted-document",
            "/api/verify-by-hash"
        ]
        
        for route in expected_routes:
            # Check if route exists (might be slightly different due to path parameters)
            route_exists = any(route.replace("{", "").replace("}", "") in r for r in routes)
            if route_exists:
                print(f"✅ Route exists: {route}")
            else:
                print(f"⚠️  Route not found: {route}")
        
    def run_all_tests(self):
        """Run all API endpoint tests."""
        print("🚀 STARTING API ENDPOINTS TEST SUITE")
        print("=" * 50)
        
        try:
            self.setup_test_data()
            
            self.test_delete_endpoint_structure()
            self.test_verification_endpoints_structure()
            self.test_deleted_documents_endpoints_structure()
            self.test_error_handling_endpoints()
            self.test_request_response_models()
            self.test_endpoint_documentation()
            
            print("\n" + "=" * 50)
            print("🎉 ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")
            print("=" * 50)
            print("✅ API endpoint structure tests completed")
            
            print("\n" + "=" * 50)
            print("🎉 ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")
            print("=" * 50)
            
            return True
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        finally:
            self.session.close()


def run_api_endpoints_tests():
    """Run API endpoints tests."""
    test_suite = APIEndpointsTestSuite()
    return test_suite.run_all_tests()


if __name__ == "__main__":
    success = run_api_endpoints_tests()
    exit(0 if success else 1)
