"""
Test Suite for Document Signing Integration

This test suite tests the document signing functionality including
DocuSign, Adobe Sign, HelloSign, and internal signing integration.
"""

import pytest
import json
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch

# Import the document signing service
try:
    from src.document_signing_service import (
        DocumentSigningService, 
        Signer, 
        SigningField, 
        SigningStatus, 
        SigningProvider
    )
except ImportError:
    # Fallback for when running as script
    from document_signing_service import (
        DocumentSigningService, 
        Signer, 
        SigningField, 
        SigningStatus, 
        SigningProvider
    )


class DocumentSigningTestSuite:
    """Test suite for document signing functionality."""
    
    def __init__(self):
        self.signing_service = DocumentSigningService()
        
    async def test_1_create_signing_envelope(self):
        """Test creating a signing envelope."""
        print("\n🧪 Test 1: Create Signing Envelope")
        print("-" * 50)
        
        try:
            # Test signer creation
            signer = Signer(
                email="john.doe@example.com",
                name="John Doe",
                role="signer",
                order=1
            )
            
            # Test signing field creation
            signing_field = SigningField(
                field_type="signature",
                page_number=1,
                x_position=100.0,
                y_position=200.0,
                width=150.0,
                height=50.0,
                recipient_id="1",
                required=True
            )
            
            # Test DocuSign envelope creation
            result = await self.signing_service.create_signing_envelope(
                document_id="DOC_001",
                document_name="Test Document",
                signers=[signer],
                signing_fields=[signing_field],
                template_type="loan_application",
                provider=SigningProvider.DOCUSIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id is not None
            assert result.status == SigningStatus.DRAFT
            assert result.processing_time > 0.0
            
            print("✅ DocuSign envelope creation successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            print(f"   Processing Time: {result.processing_time:.3f}s")
            
            # Test Adobe Sign envelope creation
            result = await self.signing_service.create_signing_envelope(
                document_id="DOC_002",
                document_name="Test Document 2",
                signers=[signer],
                signing_fields=[signing_field],
                template_type="credit_agreement",
                provider=SigningProvider.ADOBE_SIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id is not None
            assert result.status == SigningStatus.DRAFT
            
            print("✅ Adobe Sign envelope creation successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_2_send_signing_envelope(self):
        """Test sending a signing envelope."""
        print("\n🧪 Test 2: Send Signing Envelope")
        print("-" * 50)
        
        try:
            # Test DocuSign envelope sending
            result = await self.signing_service.send_signing_envelope(
                envelope_id="ENV_TEST_001",
                provider=SigningProvider.DOCUSIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id == "ENV_TEST_001"
            assert result.status == SigningStatus.SENT
            assert result.processing_time > 0.0
            
            print("✅ DocuSign envelope sending successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            print(f"   Processing Time: {result.processing_time:.3f}s")
            
            # Test Adobe Sign envelope sending
            result = await self.signing_service.send_signing_envelope(
                envelope_id="ENV_TEST_002",
                provider=SigningProvider.ADOBE_SIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id == "ENV_TEST_002"
            assert result.status == SigningStatus.SENT
            
            print("✅ Adobe Sign envelope sending successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_3_get_envelope_status(self):
        """Test getting envelope status."""
        print("\n🧪 Test 3: Get Envelope Status")
        print("-" * 50)
        
        try:
            # Test DocuSign status retrieval
            result = await self.signing_service.get_signing_status(
                envelope_id="ENV_TEST_001",
                provider=SigningProvider.DOCUSIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id == "ENV_TEST_001"
            assert result.status == SigningStatus.SENT
            assert result.provider_response is not None
            assert result.processing_time > 0.0
            
            print("✅ DocuSign status retrieval successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            print(f"   Processing Time: {result.processing_time:.3f}s")
            
            # Test Adobe Sign status retrieval
            result = await self.signing_service.get_signing_status(
                envelope_id="ENV_TEST_002",
                provider=SigningProvider.ADOBE_SIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id == "ENV_TEST_002"
            assert result.status == SigningStatus.SENT
            
            print("✅ Adobe Sign status retrieval successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_4_cancel_signing_envelope(self):
        """Test cancelling a signing envelope."""
        print("\n🧪 Test 4: Cancel Signing Envelope")
        print("-" * 50)
        
        try:
            # Test DocuSign envelope cancellation
            result = await self.signing_service.cancel_signing_envelope(
                envelope_id="ENV_TEST_001",
                reason="Test cancellation",
                provider=SigningProvider.DOCUSIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id == "ENV_TEST_001"
            assert result.status == SigningStatus.VOIDED
            assert result.processing_time > 0.0
            
            print("✅ DocuSign envelope cancellation successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            print(f"   Processing Time: {result.processing_time:.3f}s")
            
            # Test Adobe Sign envelope cancellation
            result = await self.signing_service.cancel_signing_envelope(
                envelope_id="ENV_TEST_002",
                reason="Test cancellation",
                provider=SigningProvider.ADOBE_SIGN
            )
            
            # Verify result
            assert result.success == True
            assert result.envelope_id == "ENV_TEST_002"
            assert result.status == SigningStatus.VOIDED
            
            print("✅ Adobe Sign envelope cancellation successful")
            print(f"   Envelope ID: {result.envelope_id}")
            print(f"   Status: {result.status.value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_5_download_signed_document(self):
        """Test downloading signed documents."""
        print("\n🧪 Test 5: Download Signed Document")
        print("-" * 50)
        
        try:
            # Test DocuSign document download
            result = await self.signing_service.download_signed_document(
                envelope_id="ENV_TEST_001",
                provider=SigningProvider.DOCUSIGN
            )
            
            # Verify result
            assert result['success'] == True
            assert result['document_data'] is not None
            assert result['metadata'] is not None
            assert 'envelope_id' in result['metadata']
            assert 'document_name' in result['metadata']
            
            print("✅ DocuSign document download successful")
            print(f"   Document Name: {result['metadata']['document_name']}")
            print(f"   Content Type: {result['metadata']['content_type']}")
            print(f"   File Size: {result['metadata']['file_size']} bytes")
            
            # Test Adobe Sign document download
            result = await self.signing_service.download_signed_document(
                envelope_id="ENV_TEST_002",
                provider=SigningProvider.ADOBE_SIGN
            )
            
            # Verify result
            assert result['success'] == True
            assert result['document_data'] is not None
            assert result['metadata'] is not None
            
            print("✅ Adobe Sign document download successful")
            print(f"   Document Name: {result['metadata']['document_name']}")
            print(f"   Content Type: {result['metadata']['content_type']}")
            print(f"   File Size: {result['metadata']['file_size']} bytes")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_6_verify_signature(self):
        """Test signature verification."""
        print("\n🧪 Test 6: Verify Signature")
        print("-" * 50)
        
        try:
            # Test DocuSign signature verification
            result = await self.signing_service.verify_signature(
                envelope_id="ENV_TEST_001",
                provider=SigningProvider.DOCUSIGN
            )
            
            # Verify result
            assert result['success'] == True
            assert result['verified'] == True
            assert result['verification_details'] is not None
            assert 'envelope_id' in result['verification_details']
            assert 'signature_verified' in result['verification_details']
            
            print("✅ DocuSign signature verification successful")
            print(f"   Verified: {result['verified']}")
            print(f"   Verification Method: {result['verification_details']['verification_method']}")
            print(f"   Verified At: {result['verification_details']['verified_at']}")
            
            # Test Adobe Sign signature verification
            result = await self.signing_service.verify_signature(
                envelope_id="ENV_TEST_002",
                provider=SigningProvider.ADOBE_SIGN
            )
            
            # Verify result
            assert result['success'] == True
            assert result['verified'] == True
            assert result['verification_details'] is not None
            
            print("✅ Adobe Sign signature verification successful")
            print(f"   Verified: {result['verified']}")
            print(f"   Verification Method: {result['verification_details']['verification_method']}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_7_signing_templates(self):
        """Test signing templates functionality."""
        print("\n🧪 Test 7: Signing Templates")
        print("-" * 50)
        
        try:
            # Test getting signing templates
            templates = self.signing_service.get_signing_templates()
            
            # Verify templates
            assert isinstance(templates, dict)
            assert len(templates) > 0
            assert 'loan_application' in templates
            assert 'credit_agreement' in templates
            assert 'closing_documents' in templates
            
            # Verify template structure
            loan_template = templates['loan_application']
            assert 'subject' in loan_template
            assert 'message' in loan_template
            assert 'reminder_frequency' in loan_template
            assert 'expiration_days' in loan_template
            
            print("✅ Signing templates retrieval successful")
            print(f"   Available Templates: {len(templates)}")
            for template_name in templates.keys():
                print(f"   - {template_name}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_8_signing_providers(self):
        """Test signing providers functionality."""
        print("\n🧪 Test 8: Signing Providers")
        print("-" * 50)
        
        try:
            # Test getting signing providers
            providers = self.signing_service.get_signing_providers()
            
            # Verify providers
            assert isinstance(providers, list)
            assert len(providers) > 0
            assert 'docusign' in providers
            assert 'adobe_sign' in providers
            assert 'hello_sign' in providers
            assert 'internal' in providers
            
            print("✅ Signing providers retrieval successful")
            print(f"   Available Providers: {len(providers)}")
            for provider in providers:
                print(f"   - {provider}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_9_verification_settings(self):
        """Test verification settings functionality."""
        print("\n🧪 Test 9: Verification Settings")
        print("-" * 50)
        
        try:
            # Test getting verification settings
            settings = self.signing_service.get_verification_settings()
            
            # Verify settings
            assert isinstance(settings, dict)
            assert len(settings) > 0
            assert 'require_authentication' in settings
            assert 'require_identity_verification' in settings
            assert 'allow_delegation' in settings
            
            print("✅ Verification settings retrieval successful")
            print(f"   Available Settings: {len(settings)}")
            for setting, value in settings.items():
                print(f"   - {setting}: {value}")
            
            # Test updating verification settings
            new_settings = {
                'require_authentication': True,
                'require_identity_verification': True,
                'allow_delegation': False
            }
            
            success = self.signing_service.update_verification_settings(new_settings)
            assert success == True
            
            # Verify updated settings
            updated_settings = self.signing_service.get_verification_settings()
            assert updated_settings['require_authentication'] == True
            assert updated_settings['require_identity_verification'] == True
            assert updated_settings['allow_delegation'] == False
            
            print("✅ Verification settings update successful")
            print("   Updated settings:")
            for setting, value in new_settings.items():
                print(f"   - {setting}: {value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def test_10_comprehensive_workflow(self):
        """Test comprehensive signing workflow."""
        print("\n🧪 Test 10: Comprehensive Signing Workflow")
        print("-" * 50)
        
        try:
            # Create comprehensive signers
            signers = [
                Signer(
                    email="borrower@example.com",
                    name="John Borrower",
                    role="signer",
                    order=1
                ),
                Signer(
                    email="co_borrower@example.com",
                    name="Jane Co-Borrower",
                    role="signer",
                    order=2
                )
            ]
            
            # Create comprehensive signing fields
            signing_fields = [
                SigningField(
                    field_type="signature",
                    page_number=1,
                    x_position=100.0,
                    y_position=200.0,
                    width=150.0,
                    height=50.0,
                    recipient_id="1",
                    required=True,
                    tab_label="Borrower Signature"
                ),
                SigningField(
                    field_type="signature",
                    page_number=1,
                    x_position=100.0,
                    y_position=300.0,
                    width=150.0,
                    height=50.0,
                    recipient_id="2",
                    required=True,
                    tab_label="Co-Borrower Signature"
                ),
                SigningField(
                    field_type="date",
                    page_number=1,
                    x_position=300.0,
                    y_position=200.0,
                    width=100.0,
                    height=30.0,
                    recipient_id="1",
                    required=True,
                    tab_label="Date"
                )
            ]
            
            # Test complete workflow with DocuSign
            # 1. Create envelope
            create_result = await self.signing_service.create_signing_envelope(
                document_id="DOC_WORKFLOW_001",
                document_name="Loan Application Workflow",
                signers=signers,
                signing_fields=signing_fields,
                template_type="loan_application",
                provider=SigningProvider.DOCUSIGN
            )
            
            assert create_result.success == True
            envelope_id = create_result.envelope_id
            
            print("✅ Step 1: Envelope creation successful")
            print(f"   Envelope ID: {envelope_id}")
            
            # 2. Send envelope
            send_result = await self.signing_service.send_signing_envelope(
                envelope_id=envelope_id,
                provider=SigningProvider.DOCUSIGN
            )
            
            assert send_result.success == True
            assert send_result.status == SigningStatus.SENT
            
            print("✅ Step 2: Envelope sending successful")
            print(f"   Status: {send_result.status.value}")
            
            # 3. Check status
            status_result = await self.signing_service.get_signing_status(
                envelope_id=envelope_id,
                provider=SigningProvider.DOCUSIGN
            )
            
            assert status_result.success == True
            assert status_result.status == SigningStatus.SENT
            
            print("✅ Step 3: Status check successful")
            print(f"   Status: {status_result.status.value}")
            
            # 4. Download document (simulated)
            download_result = await self.signing_service.download_signed_document(
                envelope_id=envelope_id,
                provider=SigningProvider.DOCUSIGN
            )
            
            assert download_result['success'] == True
            assert download_result['document_data'] is not None
            
            print("✅ Step 4: Document download successful")
            print(f"   Document Name: {download_result['metadata']['document_name']}")
            
            # 5. Verify signature
            verify_result = await self.signing_service.verify_signature(
                envelope_id=envelope_id,
                provider=SigningProvider.DOCUSIGN
            )
            
            assert verify_result['success'] == True
            assert verify_result['verified'] == True
            
            print("✅ Step 5: Signature verification successful")
            print(f"   Verified: {verify_result['verified']}")
            
            print("✅ Comprehensive signing workflow completed successfully")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all document signing tests."""
        print("🚀 STARTING DOCUMENT SIGNING TEST SUITE")
        print("=" * 60)
        
        try:
            test_1_result = await self.test_1_create_signing_envelope()
            test_2_result = await self.test_2_send_signing_envelope()
            test_3_result = await self.test_3_get_envelope_status()
            test_4_result = await self.test_4_cancel_signing_envelope()
            test_5_result = await self.test_5_download_signed_document()
            test_6_result = await self.test_6_verify_signature()
            test_7_result = await self.test_7_signing_templates()
            test_8_result = await self.test_8_signing_providers()
            test_9_result = await self.test_9_verification_settings()
            test_10_result = await self.test_10_comprehensive_workflow()
            
            all_tests_passed = all([
                test_1_result,
                test_2_result,
                test_3_result,
                test_4_result,
                test_5_result,
                test_6_result,
                test_7_result,
                test_8_result,
                test_9_result,
                test_10_result
            ])
            
            if all_tests_passed:
                print("\n" + "=" * 60)
                print("🎉 ALL DOCUMENT SIGNING TESTS PASSED SUCCESSFULLY!")
                print("=" * 60)
                return True
            else:
                print("\n" + "=" * 60)
                print("❌ SOME TESTS FAILED")
                print("=" * 60)
                return False
                
        except Exception as e:
            print(f"\n❌ TEST SUITE FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False


def run_document_signing_tests():
    """Run document signing tests."""
    test_suite = DocumentSigningTestSuite()
    return test_suite.run_all_tests()


if __name__ == "__main__":
    success = asyncio.run(run_document_signing_tests())
    exit(0 if success else 1)
