"""
Standalone IntegrityX Test Suite

This test suite tests all the implemented features without requiring the server to be running.
It demonstrates the functionality of all the implemented services.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone

# Import all the implemented services
from src.document_signing_service import DocumentSigningService, Signer, SigningField, SigningProvider
from src.enhanced_document_intelligence import EnhancedDocumentIntelligenceService
from src.bulk_operations_analytics import BulkOperationsAnalytics

class StandaloneIntegrityXTest:
    """Standalone test suite for IntegrityX services."""
    
    def __init__(self):
        self.signing_service = DocumentSigningService()
        self.ai_service = EnhancedDocumentIntelligenceService()
        self.analytics_service = BulkOperationsAnalytics()
    
    async def test_document_signing_service(self):
        """Test document signing service functionality."""
        print("\n🧪 Test 1: Document Signing Service")
        print("-" * 50)
        
        try:
            # Create test signers
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
            
            # Create test signing fields
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
                )
            ]
            
            # Test envelope creation
            result = await self.signing_service.create_signing_envelope(
                document_id="DOC_TEST_001",
                document_name="Test Loan Application",
                signers=signers,
                signing_fields=signing_fields,
                template_type="loan_application",
                provider=SigningProvider.DOCUSIGN
            )
            
            if result.success:
                print("✅ Document signing envelope creation successful")
                print(f"   Envelope ID: {result.envelope_id}")
                print(f"   Status: {result.status.value}")
                print(f"   Processing Time: {result.processing_time:.3f}s")
                
                # Test envelope sending
                send_result = await self.signing_service.send_signing_envelope(
                    envelope_id=result.envelope_id,
                    provider=SigningProvider.DOCUSIGN
                )
                
                if send_result.success:
                    print("✅ Document signing envelope sending successful")
                    print(f"   Status: {send_result.status.value}")
                else:
                    print(f"❌ Document signing envelope sending failed: {send_result.error_message}")
                
                return True
            else:
                print(f"❌ Document signing envelope creation failed: {result.error_message}")
                return False
                
        except Exception as e:
            print(f"❌ Document signing service test failed: {e}")
            return False
    
    async def test_ai_document_processing(self):
        """Test AI document processing functionality."""
        print("\n🧪 Test 2: AI Document Processing")
        print("-" * 50)
        
        try:
            # Create test document
            test_document = {
                "loanId": "LOAN_AI_TEST_001",
                "amount": 300000,
                "rate": 5.75,
                "term": 360,
                "borrower": {
                    "name": "Jane Smith",
                    "email": "jane.smith@example.com"
                },
                "application": "Loan Application",
                "borrower_information": "Jane Smith",
                "income_verification": "Verified",
                "credit_score": 780
            }
            
            # Test document analysis
            result = await self.ai_service.analyze_document(
                file_content=json.dumps(test_document).encode(),
                filename="test_loan_application.json",
                content_type="application/json"
            )
            
            print("✅ AI document analysis successful")
            print(f"   Document Type: {result.document_type}")
            print(f"   Classification Confidence: {result.classification_confidence:.2f}")
            print(f"   Quality Score: {result.quality_score:.2f}")
            print(f"   Risk Score: {result.risk_score:.2f}")
            print(f"   Processing Time: {result.processing_time:.3f}s")
            print(f"   Extracted Fields: {len(result.extracted_fields)}")
            print(f"   Recommendations: {len(result.recommendations)}")
            
            return True
            
        except Exception as e:
            print(f"❌ AI document processing test failed: {e}")
            return False
    
    async def test_bulk_operations_analytics(self):
        """Test bulk operations analytics functionality."""
        print("\n🧪 Test 3: Bulk Operations Analytics")
        print("-" * 50)
        
        try:
            # Test bulk operations analytics
            result = await self.analytics_service.get_bulk_operations_analytics()
            
            print("✅ Bulk operations analytics successful")
            bulk_metrics = result.get('bulk_operations_metrics', {})
            object_validator = result.get('object_validator_usage', {})
            time_savings = result.get('time_savings_analysis', {})
            
            print(f"   Total Bulk Operations: {bulk_metrics.get('total_bulk_operations', 0)}")
            print(f"   Success Rate: {bulk_metrics.get('success_rate', 0):.1f}%")
            print(f"   ObjectValidator Usage: {object_validator.get('usage_count', 0)}")
            print(f"   Time Saved (Hours): {time_savings.get('time_saved_by_bulk_operations', {}).get('total_hours_saved', 0):.1f}")
            
            return True
            
        except Exception as e:
            print(f"❌ Bulk operations analytics test failed: {e}")
            return False
    
    def test_signing_templates(self):
        """Test signing templates functionality."""
        print("\n🧪 Test 4: Signing Templates")
        print("-" * 50)
        
        try:
            templates = self.signing_service.get_signing_templates()
            providers = self.signing_service.get_signing_providers()
            settings = self.signing_service.get_verification_settings()
            
            print("✅ Signing templates and configuration successful")
            print(f"   Available Templates: {len(templates)}")
            for template_name in templates.keys():
                print(f"     - {template_name}")
            
            print(f"   Available Providers: {len(providers)}")
            for provider in providers:
                print(f"     - {provider}")
            
            print(f"   Verification Settings: {len(settings)}")
            for setting, value in settings.items():
                print(f"     - {setting}: {value}")
            
            return True
            
        except Exception as e:
            print(f"❌ Signing templates test failed: {e}")
            return False
    
    def test_ai_capabilities(self):
        """Test AI capabilities functionality."""
        print("\n🧪 Test 5: AI Capabilities")
        print("-" * 50)
        
        try:
            # Test document classification
            test_data = {
                'extracted_fields': {
                    'loan_id': 'LOAN_TEST_001',
                    'loan_amount': '250000',
                    'interest_rate': '6.5',
                    'borrower_name': 'John Smith'
                },
                'text_content': 'Loan Application for John Smith with amount $250,000 at 6.5% interest rate'
            }
            
            classification_result = self.ai_service.classify_document_with_confidence(test_data)
            
            print("✅ AI capabilities test successful")
            print(f"   Document Type: {classification_result['type']}")
            print(f"   Classification Confidence: {classification_result['confidence']:.2f}")
            
            # Test quality assessment
            quality_score = self.ai_service.assess_document_quality(test_data)
            print(f"   Quality Score: {quality_score:.2f}")
            
            # Test risk scoring
            risk_score = self.ai_service.calculate_risk_score(test_data)
            print(f"   Risk Score: {risk_score:.2f}")
            
            # Test recommendations
            recommendations = self.ai_service.generate_recommendations(test_data, quality_score, risk_score)
            print(f"   Recommendations Generated: {len(recommendations)}")
            
            return True
            
        except Exception as e:
            print(f"❌ AI capabilities test failed: {e}")
            return False
    
    async def run_comprehensive_test(self):
        """Run comprehensive test of all IntegrityX services."""
        print("🚀 STARTING STANDALONE INTEGRITYX TEST SUITE")
        print("=" * 60)
        
        results = {}
        
        # Test 1: Document Signing Service
        results["document_signing"] = await self.test_document_signing_service()
        
        # Test 2: AI Document Processing
        results["ai_processing"] = await self.test_ai_document_processing()
        
        # Test 3: Bulk Operations Analytics
        results["bulk_analytics"] = await self.test_bulk_operations_analytics()
        
        # Test 4: Signing Templates
        results["signing_templates"] = self.test_signing_templates()
        
        # Test 5: AI Capabilities
        results["ai_capabilities"] = self.test_ai_capabilities()
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        
        successful_tests = sum(results.values())
        total_tests = len(results)
        
        for test_name, result in results.items():
            if result:
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n📊 Test Results: {successful_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🎉 IntegrityX services are working excellently!")
        elif success_rate >= 60:
            print("⚠️ IntegrityX services are working well with some issues.")
        else:
            print("❌ IntegrityX services need attention.")
        
        # Save results
        results["summary"] = {
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "success_rate": success_rate,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        with open("standalone_test_results.json", "w") as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"\n📄 Test results saved to standalone_test_results.json")
        
        return results


async def main():
    """Main function to run standalone tests."""
    print("IntegrityX Standalone Test Suite")
    print("================================")
    
    # Initialize test suite
    test_suite = StandaloneIntegrityXTest()
    
    # Run comprehensive tests
    results = await test_suite.run_comprehensive_test()
    
    return results


if __name__ == "__main__":
    asyncio.run(main())



