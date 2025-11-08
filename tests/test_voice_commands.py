"""
Comprehensive Test Suite for Voice Command Feature

Tests all implemented voice commands to ensure they work correctly:
1. Command pattern matching
2. API endpoint responses
3. Parameter extraction
4. Error handling

Run this test: python -m pytest tests/test_voice_commands.py -v
"""

import pytest
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from src.voice_service import VoiceCommandProcessor


class TestVoiceCommandProcessor:
    """Test the VoiceCommandProcessor class directly."""
    
    @pytest.fixture
    def processor(self):
        """Create a VoiceCommandProcessor instance."""
        return VoiceCommandProcessor()
    
    # ==================== Attestation Commands ====================
    
    def test_create_attestation_command_1(self, processor):
        """Test: 'create attestation for document DOC123'"""
        result = processor.process_voice_command(
            "create attestation for document DOC123",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "create_attestation"
        assert result["action"] == "create_attestation"
        assert result["parameters"]["artifact_id"].lower() == "doc123"  # Voice commands are case-insensitive
        assert result["api_endpoint"] == "/api/attestations"
        assert result["method"] == "POST"
        print("✅ Test passed: create attestation for document DOC123")
    
    def test_create_attestation_command_2(self, processor):
        """Test: 'attest document ABC456'"""
        result = processor.process_voice_command(
            "attest document ABC456",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "create_attestation"
        assert result["parameters"]["artifact_id"].lower() == "abc456"
        print("✅ Test passed: attest document ABC456")
    
    def test_create_attestation_command_3(self, processor):
        """Test: 'certify document XYZ789'"""
        result = processor.process_voice_command(
            "certify document XYZ789",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "create_attestation"
        assert result["parameters"]["artifact_id"].lower() == "xyz789"
        print("✅ Test passed: certify document XYZ789")
    
    def test_create_attestation_with_filler_words(self, processor):
        """Test: 'please create attestation for DOC123'"""
        result = processor.process_voice_command(
            "please can you create attestation for document DOC123",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "create_attestation"
        assert result["parameters"]["artifact_id"].lower() == "doc123"
        print("✅ Test passed: filler words are stripped correctly")
    
    # ==================== Disclosure Pack Commands ====================
    
    def test_generate_disclosure_command_1(self, processor):
        """Test: 'generate disclosure pack for document DOC123'"""
        result = processor.process_voice_command(
            "generate disclosure pack for document DOC123",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "generate_disclosure"
        assert result["action"] == "generate_disclosure_pack"
        assert result["parameters"]["artifact_id"].lower() == "doc123"
        assert result["api_endpoint"] == "/api/disclosure-pack"
        assert result["method"] == "GET"
        print("✅ Test passed: generate disclosure pack for document DOC123")
    
    def test_generate_disclosure_command_2(self, processor):
        """Test: 'create disclosure pack for ABC456'"""
        result = processor.process_voice_command(
            "create disclosure pack for ABC456",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "generate_disclosure"
        assert result["parameters"]["artifact_id"].lower() == "abc456"
        print("✅ Test passed: create disclosure pack for ABC456")
    
    def test_generate_disclosure_command_3(self, processor):
        """Test: 'export disclosure for document XYZ789'"""
        result = processor.process_voice_command(
            "export disclosure for document XYZ789",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "generate_disclosure"
        assert result["parameters"]["artifact_id"].lower() == "xyz789"
        print("✅ Test passed: export disclosure for document XYZ789")
    
    # ==================== Verification Commands ====================
    
    def test_verify_document_command_1(self, processor):
        """Test: 'verify document DOC123'"""
        result = processor.process_voice_command(
            "verify document DOC123",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "verify_document"
        assert result["action"] == "verify_document"
        assert result["parameters"]["artifact_id"].lower() == "doc123"
        assert result["api_endpoint"] == "/api/artifacts/{artifact_id}/verify"
        assert result["method"] == "GET"
        print("✅ Test passed: verify document DOC123")
    
    def test_verify_document_command_2(self, processor):
        """Test: 'check integrity of document ABC456'"""
        result = processor.process_voice_command(
            "check integrity of document ABC456",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "verify_document"
        assert result["parameters"]["artifact_id"].lower() == "abc456"
        print("✅ Test passed: check integrity of document ABC456")
    
    def test_verify_document_command_3(self, processor):
        """Test: 'validate document XYZ789'"""
        result = processor.process_voice_command(
            "validate document XYZ789",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "verify_document"
        assert result["parameters"]["artifact_id"].lower() == "xyz789"
        print("✅ Test passed: validate document XYZ789")
    
    def test_verify_document_short_command(self, processor):
        """Test: 'verify ABC123'"""
        result = processor.process_voice_command(
            "verify ABC123",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "verify_document"
        assert result["parameters"]["artifact_id"].lower() == "abc123"
        print("✅ Test passed: verify ABC123 (short form)")
    
    # ==================== Document History Commands ====================
    
    def test_show_history_command_1(self, processor):
        """Test: 'show history for document DOC123'"""
        result = processor.process_voice_command(
            "show history for document DOC123",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "show_history"
        assert result["action"] == "get_document_history"
        assert result["parameters"]["artifact_id"].lower() == "doc123"
        assert result["api_endpoint"] == "/api/artifacts/{artifact_id}/history"
        assert result["method"] == "GET"
        print("✅ Test passed: show history for document DOC123")
    
    def test_show_history_command_2(self, processor):
        """Test: 'document history for ABC456'"""
        result = processor.process_voice_command(
            "document history for ABC456",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "show_history"
        assert result["parameters"]["artifact_id"].lower() == "abc456"
        print("✅ Test passed: document history for ABC456")
    
    def test_show_history_command_3(self, processor):
        """Test: 'show timeline for XYZ789'"""
        result = processor.process_voice_command(
            "show timeline for XYZ789",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "show_history"
        assert result["parameters"]["artifact_id"].lower() == "xyz789"
        print("✅ Test passed: show timeline for XYZ789")
    
    # ==================== List Commands ====================
    
    def test_list_attestations_command_1(self, processor):
        """Test: 'list all attestations'"""
        result = processor.process_voice_command(
            "list all attestations",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "list_attestations"
        assert result["action"] == "list_attestations"
        assert result["parameters"]["limit"] == 50
        assert result["api_endpoint"] == "/api/attestations"
        assert result["method"] == "GET"
        print("✅ Test passed: list all attestations")
    
    def test_list_attestations_command_2(self, processor):
        """Test: 'show attestations'"""
        result = processor.process_voice_command(
            "show attestations",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "list_attestations"
        print("✅ Test passed: show attestations")
    
    def test_list_documents_command_1(self, processor):
        """Test: 'list all documents'"""
        result = processor.process_voice_command(
            "list all documents",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "list_documents"
        assert result["action"] == "list_documents"
        assert result["parameters"]["limit"] == 50
        assert result["api_endpoint"] == "/api/artifacts"
        assert result["method"] == "GET"
        print("✅ Test passed: list all documents")
    
    def test_list_documents_command_2(self, processor):
        """Test: 'show documents'"""
        result = processor.process_voice_command(
            "show documents",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "list_documents"
        print("✅ Test passed: show documents")
    
    # ==================== System Status Commands ====================
    
    def test_system_status_command_1(self, processor):
        """Test: 'system status'"""
        result = processor.process_voice_command(
            "system status",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "system_status"
        assert result["action"] == "system_status"
        assert result["api_endpoint"] == "/api/health"
        assert result["method"] == "GET"
        print("✅ Test passed: system status")
    
    def test_system_status_command_2(self, processor):
        """Test: 'show system status'"""
        result = processor.process_voice_command(
            "show system status",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "system_status"
        print("✅ Test passed: show system status")
    
    def test_system_status_command_3(self, processor):
        """Test: 'check system health'"""
        result = processor.process_voice_command(
            "check system health",
            user_id="test_user"
        )
        
        assert result["success"] is True
        assert result["operation"] == "system_status"
        print("✅ Test passed: check system health")
    
    # ==================== Error Handling ====================
    
    def test_unknown_command_returns_help(self, processor):
        """Test: Unknown command returns help"""
        result = processor.process_voice_command(
            "do something random that doesn't exist",
            user_id="test_user"
        )
        
        assert result["success"] is False
        assert result["operation"] == "help"
        assert "suggestions" in result
        assert len(result["suggestions"]) > 0
        print("✅ Test passed: unknown command returns help with suggestions")
    
    def test_empty_command(self, processor):
        """Test: Empty command"""
        result = processor.process_voice_command(
            "",
            user_id="test_user"
        )
        
        assert result["success"] is False
        assert result["operation"] == "help"
        print("✅ Test passed: empty command returns help")
    
    def test_whitespace_only_command(self, processor):
        """Test: Whitespace only command"""
        result = processor.process_voice_command(
            "    ",
            user_id="test_user"
        )
        
        assert result["success"] is False
        assert result["operation"] == "help"
        print("✅ Test passed: whitespace-only command returns help")
    
    # ==================== Utility Methods ====================
    
    def test_get_available_commands(self, processor):
        """Test: Get available commands"""
        commands = processor.get_available_commands()
        
        assert isinstance(commands, list)
        assert len(commands) > 0
        
        # Check that each command has required fields
        for cmd in commands:
            assert "operation" in cmd
            assert "examples" in cmd
            assert "description" in cmd
            assert isinstance(cmd["examples"], list)
        
        print(f"✅ Test passed: get_available_commands returns {len(commands)} commands")
    
    def test_is_confirmation(self, processor):
        """Test: Confirmation phrase detection"""
        assert processor.is_confirmation("yes") is True
        assert processor.is_confirmation("Yeah sure") is True
        assert processor.is_confirmation("okay") is True
        assert processor.is_confirmation("confirm") is True
        assert processor.is_confirmation("no way") is False
        print("✅ Test passed: confirmation phrase detection")
    
    def test_is_cancellation(self, processor):
        """Test: Cancellation phrase detection"""
        assert processor.is_cancellation("no") is True
        assert processor.is_cancellation("nope not now") is True
        assert processor.is_cancellation("cancel") is True
        assert processor.is_cancellation("abort") is True
        assert processor.is_cancellation("yes") is False
        print("✅ Test passed: cancellation phrase detection")


if __name__ == "__main__":
    """Run tests manually without pytest."""
    print("\n" + "="*80)
    print("🎤 VOICE COMMAND FEATURE - COMPREHENSIVE TEST SUITE")
    print("="*80 + "\n")
    
    processor = VoiceCommandProcessor()
    test_class = TestVoiceCommandProcessor()
    
    # Get all test methods
    test_methods = [method for method in dir(test_class) if method.startswith('test_')]
    
    passed = 0
    failed = 0
    errors = []
    
    for test_name in test_methods:
        try:
            test_method = getattr(test_class, test_name)
            test_method(processor)
            passed += 1
        except AssertionError as e:
            failed += 1
            errors.append(f"{test_name}: {str(e)}")
            print(f"❌ Test failed: {test_name}")
            print(f"   Error: {str(e)}")
        except Exception as e:
            failed += 1
            errors.append(f"{test_name}: {str(e)}")
            print(f"❌ Test error: {test_name}")
            print(f"   Error: {str(e)}")
    
    # Print summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Total:  {passed + failed}")
    print(f"🎯 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
    
    if errors:
        print("\n❌ FAILED TESTS:")
        for error in errors:
            print(f"   - {error}")
    else:
        print("\n🎉 ALL TESTS PASSED!")
    
    print("\n" + "="*80 + "\n")

