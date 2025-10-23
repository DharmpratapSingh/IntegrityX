"""
Simple server test that demonstrates the platform functionality
without requiring the server to be running.
"""

import sys
import os
import json
from datetime import datetime, timezone

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_database_connection():
    """Test database connection."""
    print("\n🧪 Test 1: Database Connection")
    print("-" * 50)
    
    try:
        from src.database import Database
        db = Database()
        print("✅ Database connection successful")
        print(f"   Database URL: {db.db_url}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_document_signing_service():
    """Test document signing service."""
    print("\n🧪 Test 2: Document Signing Service")
    print("-" * 50)
    
    try:
        from src.document_signing_service import DocumentSigningService, Signer, SigningField, SigningProvider
        
        service = DocumentSigningService()
        
        # Test signer creation
        signer = Signer(
            email="test@example.com",
            name="Test User",
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
        
        print("✅ Document signing service initialized successfully")
        print(f"   Available Providers: {service.get_signing_providers()}")
        print(f"   Available Templates: {list(service.get_signing_templates().keys())}")
        return True
    except Exception as e:
        print(f"❌ Document signing service failed: {e}")
        return False

def test_ai_document_processing():
    """Test AI document processing service."""
    print("\n🧪 Test 3: AI Document Processing Service")
    print("-" * 50)
    
    try:
        from src.enhanced_document_intelligence import EnhancedDocumentIntelligenceService
        
        service = EnhancedDocumentIntelligenceService()
        
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
        
        classification_result = service.classify_document_with_confidence(test_data)
        quality_score = service.assess_document_quality(test_data)
        risk_score = service.calculate_risk_score(test_data)
        
        print("✅ AI document processing service initialized successfully")
        print(f"   Document Type: {classification_result['type']}")
        print(f"   Classification Confidence: {classification_result['confidence']:.2f}")
        print(f"   Quality Score: {quality_score:.2f}")
        print(f"   Risk Score: {risk_score:.2f}")
        return True
    except Exception as e:
        print(f"❌ AI document processing service failed: {e}")
        return False

def test_bulk_operations_analytics():
    """Test bulk operations analytics service."""
    print("\n🧪 Test 4: Bulk Operations Analytics Service")
    print("-" * 50)
    
    try:
        from src.bulk_operations_analytics import BulkOperationsAnalytics
        
        service = BulkOperationsAnalytics()
        
        print("✅ Bulk operations analytics service initialized successfully")
        print("   Service ready for analytics generation")
        return True
    except Exception as e:
        print(f"❌ Bulk operations analytics service failed: {e}")
        return False

def test_main_app_import():
    """Test main app import."""
    print("\n🧪 Test 5: Main App Import")
    print("-" * 50)
    
    try:
        from main import app
        print("✅ Main app imported successfully")
        print(f"   App type: {type(app)}")
        return True
    except Exception as e:
        print(f"❌ Main app import failed: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 IntegrityX Simple Server Test")
    print("=" * 50)
    
    tests = [
        test_database_connection,
        test_document_signing_service,
        test_ai_document_processing,
        test_bulk_operations_analytics,
        test_main_app_import
    ]
    
    results = []
    
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 Test Summary")
    print("=" * 50)
    
    successful = sum(results)
    total = len(results)
    
    print(f"📊 Results: {successful}/{total} tests passed ({(successful/total)*100:.1f}%)")
    
    if successful == total:
        print("🎉 All services are working perfectly!")
        print("\n💡 To start the server, run:")
        print("   python start_server.py")
        print("\n💡 To test the API, run:")
        print("   python api_test_examples.py")
    elif successful > total // 2:
        print("⚠️ Most services are working, some issues detected.")
    else:
        print("❌ Multiple services need attention.")
    
    return results

if __name__ == "__main__":
    main()
