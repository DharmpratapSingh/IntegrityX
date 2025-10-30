"""
Voice Command Processing Service

Handles voice-activated commands for document operations.
"""

import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class VoiceCommandProcessor:
    """Processes voice commands and converts them to API operations."""
    
    def __init__(self):
        self.command_patterns = {
            # Document operations
            "create_attestation": [
                r"create attestation for document (\w+)",
                r"attest document (\w+)",
                r"certify document (\w+)",
                r"create attestation for (\w+)"
            ],
            "generate_disclosure": [
                r"generate disclosure pack for document (\w+)",
                r"create disclosure pack for (\w+)",
                r"export disclosure for document (\w+)",
                r"generate compliance pack for (\w+)"
            ],
            "verify_document": [
                r"verify document (\w+)",
                r"check integrity of document (\w+)",
                r"validate document (\w+)",
                r"verify (\w+)"
            ],
            "show_history": [
                r"show history for document (\w+)",
                r"document history for (\w+)",
                r"show timeline for (\w+)",
                r"history of document (\w+)"
            ],
            "list_attestations": [
                r"list all attestations",
                r"show attestations",
                r"display attestations",
                r"get attestation list"
            ],
            "list_documents": [
                r"list all documents",
                r"show documents",
                r"display documents",
                r"get document list"
            ],
            "system_status": [
                r"system status",
                r"show system status",
                r"check system health",
                r"system health"
            ],
            
            # Bulk Operations Analytics (Point 1)
            "bulk_stats": [
                r"show bulk verification statistics",
                r"bulk verification statistics",
                r"bulk verification stats",
                r"show bulk stats"
            ],
            "bulk_stats_timeframe": [
                r"show bulk verification statistics for (this month|this week|today)",
                r"bulk verification stats for (this month|this week|today)",
                r"show bulk stats for (this month|this week|today)"
            ],
            "documents_sealed_today": [
                r"how many documents were sealed today",
                r"documents sealed today",
                r"show documents sealed today",
                r"how many seals today"
            ],
            "compliance_success_rate": [
                r"show compliance success rate",
                r"compliance success rate",
                r"what is the compliance rate",
                r"show success rate"
            ],
            "failed_verifications": [
                r"list all failed verifications",
                r"show failed verifications",
                r"failed verifications",
                r"show verification failures"
            ],
            "bulk_operations_summary": [
                r"show bulk operations summary",
                r"bulk operations summary",
                r"show all bulk operations",
                r"bulk operations report"
            ],
            
            # Document Provenance & Time Machine (Point 3)
            "document_lineage": [
                r"show document lineage for (\w+)",
                r"document lineage for (\w+)",
                r"show lineage of (\w+)",
                r"lineage for document (\w+)"
            ],
            "document_versions": [
                r"show all versions of (\w+)",
                r"document versions for (\w+)",
                r"show versions of document (\w+)",
                r"all versions of (\w+)"
            ],
            "document_last_modified": [
                r"when was (\w+) last modified",
                r"last modified date for (\w+)",
                r"when was document (\w+) updated",
                r"show last modification for (\w+)"
            ],
            "document_creator": [
                r"who created document (\w+)",
                r"who created (\w+)",
                r"show creator of (\w+)",
                r"document creator for (\w+)"
            ],
            "document_provenance": [
                r"show provenance for (\w+)",
                r"document provenance for (\w+)",
                r"show provenance chain for (\w+)",
                r"provenance of document (\w+)"
            ],
            
            # Security & Tamper Detection (Point 4)
            "quantum_signature": [
                r"check quantum signature for (\w+)",
                r"quantum signature for (\w+)",
                r"show quantum signature of (\w+)",
                r"verify quantum signature for document (\w+)"
            ],
            "tamper_detection": [
                r"show tamper detection results for (\w+)",
                r"tamper detection for (\w+)",
                r"check tampering on (\w+)",
                r"has document (\w+) been tampered"
            ],
            "security_alerts": [
                r"list documents with security alerts",
                r"show security alerts",
                r"documents with alerts",
                r"show all security alerts"
            ],
            "ai_fraud_analysis": [
                r"show ai fraud analysis for (\w+)",
                r"ai fraud analysis for (\w+)",
                r"fraud analysis for document (\w+)",
                r"check fraud on document (\w+)"
            ],
            "security_score": [
                r"show security score for (\w+)",
                r"security score for (\w+)",
                r"what is the security score of (\w+)",
                r"document security score for (\w+)"
            ]
        }
        
        self.confirmation_phrases = [
            "yes", "yeah", "yep", "sure", "okay", "ok", "confirm", "proceed"
        ]
        
        self.cancellation_phrases = [
            "no", "nope", "cancel", "stop", "abort", "nevermind"
        ]

    def process_voice_command(self, command_text: str, user_id: str = "voice_user") -> Dict[str, Any]:
        """
        Process a voice command and return the corresponding API operation.
        
        Args:
            command_text: The transcribed voice command
            user_id: ID of the user issuing the command
            
        Returns:
            Dict containing the operation details and response
        """
        try:
            # Normalize the command text
            normalized_command = command_text.lower().strip()
            
            # Remove common filler words
            normalized_command = re.sub(r'\b(please|can you|could you|would you)\b', '', normalized_command)
            normalized_command = re.sub(r'\s+', ' ', normalized_command).strip()
            
            logger.info(f"Processing voice command: '{normalized_command}' from user: {user_id}")
            
            # Try to match against known patterns
            for operation, patterns in self.command_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, normalized_command)
                    if match:
                        return self._execute_operation(operation, match, user_id, command_text)
            
            # If no pattern matches, return help
            return {
                "success": False,
                "operation": "help",
                "message": "I didn't understand that command. Here are some things you can say:",
                "suggestions": [
                    "Create attestation for document [ID]",
                    "Generate disclosure pack for document [ID]",
                    "Verify document [ID]",
                    "Show history for document [ID]",
                    "List all attestations",
                    "System status"
                ],
                "original_command": command_text,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            return {
                "success": False,
                "operation": "error",
                "message": f"Sorry, I encountered an error processing your command: {str(e)}",
                "original_command": command_text,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def _execute_operation(self, operation: str, match: re.Match, user_id: str, original_command: str) -> Dict[str, Any]:
        """Execute the matched operation."""
        
        base_response = {
            "success": True,
            "operation": operation,
            "user_id": user_id,
            "original_command": original_command,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if operation == "create_attestation":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "create_attestation",
                "parameters": {
                    "artifact_id": document_id,
                    "attestation_type": "compliance_check",
                    "attestation_data": {
                        "voice_triggered": True,
                        "triggered_by": user_id,
                        "command": original_command
                    }
                },
                "message": f"Creating attestation for document {document_id}...",
                "api_endpoint": "/api/attestations",
                "method": "POST"
            }
            
        elif operation == "generate_disclosure":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "generate_disclosure_pack",
                "parameters": {
                    "artifact_id": document_id
                },
                "message": f"Generating disclosure pack for document {document_id}...",
                "api_endpoint": "/api/disclosure-pack",
                "method": "GET"
            }
            
        elif operation == "verify_document":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "verify_document",
                "parameters": {
                    "artifact_id": document_id
                },
                "message": f"Verifying document {document_id}...",
                "api_endpoint": "/api/artifacts/{artifact_id}/verify",
                "method": "GET"
            }
            
        elif operation == "show_history":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "get_document_history",
                "parameters": {
                    "artifact_id": document_id
                },
                "message": f"Retrieving history for document {document_id}...",
                "api_endpoint": "/api/artifacts/{artifact_id}/history",
                "method": "GET"
            }
            
        elif operation == "list_attestations":
            return {
                **base_response,
                "action": "list_attestations",
                "parameters": {
                    "limit": 50,
                    "offset": 0
                },
                "message": "Retrieving all attestations...",
                "api_endpoint": "/api/attestations",
                "method": "GET"
            }
            
        elif operation == "list_documents":
            return {
                **base_response,
                "action": "list_documents",
                "parameters": {
                    "limit": 50,
                    "offset": 0
                },
                "message": "Retrieving all documents...",
                "api_endpoint": "/api/artifacts",
                "method": "GET"
            }
            
        elif operation == "system_status":
            return {
                **base_response,
                "action": "system_status",
                "parameters": {},
                "message": "Checking system status...",
                "api_endpoint": "/api/health",
                "method": "GET"
            }
        
        # Bulk Operations Analytics (Point 1)
        elif operation == "bulk_stats":
            return {
                **base_response,
                "action": "bulk_stats",
                "parameters": {},
                "message": "Retrieving bulk verification statistics...",
                "api_endpoint": "/api/bulk-operations/analytics/summary",
                "method": "GET"
            }
        
        elif operation == "bulk_stats_timeframe":
            timeframe = match.group(1)
            return {
                **base_response,
                "action": "bulk_stats_timeframe",
                "parameters": {"timeframe": timeframe},
                "message": f"Retrieving bulk verification statistics for {timeframe}...",
                "api_endpoint": f"/api/bulk-operations/analytics/summary?timeframe={timeframe}",
                "method": "GET"
            }
        
        elif operation == "documents_sealed_today":
            return {
                **base_response,
                "action": "documents_sealed_today",
                "parameters": {},
                "message": "Checking documents sealed today...",
                "api_endpoint": "/api/bulk-operations/analytics/sealed-today",
                "method": "GET"
            }
        
        elif operation == "compliance_success_rate":
            return {
                **base_response,
                "action": "compliance_success_rate",
                "parameters": {},
                "message": "Calculating compliance success rate...",
                "api_endpoint": "/api/bulk-operations/analytics/success-rate",
                "method": "GET"
            }
        
        elif operation == "failed_verifications":
            return {
                **base_response,
                "action": "failed_verifications",
                "parameters": {},
                "message": "Retrieving failed verifications...",
                "api_endpoint": "/api/bulk-operations/analytics/failures",
                "method": "GET"
            }
        
        elif operation == "bulk_operations_summary":
            return {
                **base_response,
                "action": "bulk_operations_summary",
                "parameters": {},
                "message": "Generating bulk operations summary...",
                "api_endpoint": "/api/bulk-operations/analytics/summary",
                "method": "GET"
            }
        
        # Document Provenance & Time Machine (Point 3)
        elif operation == "document_lineage":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "document_lineage",
                "parameters": {"artifact_id": document_id},
                "message": f"Retrieving lineage for document {document_id}...",
                "api_endpoint": f"/api/provenance/{document_id}/lineage",
                "method": "GET"
            }
        
        elif operation == "document_versions":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "document_versions",
                "parameters": {"artifact_id": document_id},
                "message": f"Retrieving all versions of document {document_id}...",
                "api_endpoint": f"/api/time-machine/{document_id}/versions",
                "method": "GET"
            }
        
        elif operation == "document_last_modified":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "document_last_modified",
                "parameters": {"artifact_id": document_id},
                "message": f"Checking last modification date for document {document_id}...",
                "api_endpoint": f"/api/artifacts/{document_id}",
                "method": "GET"
            }
        
        elif operation == "document_creator":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "document_creator",
                "parameters": {"artifact_id": document_id},
                "message": f"Checking who created document {document_id}...",
                "api_endpoint": f"/api/artifacts/{document_id}",
                "method": "GET"
            }
        
        elif operation == "document_provenance":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "document_provenance",
                "parameters": {"artifact_id": document_id},
                "message": f"Retrieving provenance chain for document {document_id}...",
                "api_endpoint": f"/api/provenance/{document_id}",
                "method": "GET"
            }
        
        # Security & Tamper Detection (Point 4)
        elif operation == "quantum_signature":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "quantum_signature",
                "parameters": {"artifact_id": document_id},
                "message": f"Checking quantum signature for document {document_id}...",
                "api_endpoint": f"/api/artifacts/{document_id}/quantum-signature",
                "method": "GET"
            }
        
        elif operation == "tamper_detection":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "tamper_detection",
                "parameters": {"artifact_id": document_id},
                "message": f"Running tamper detection on document {document_id}...",
                "api_endpoint": f"/api/artifacts/{document_id}/tamper-check",
                "method": "GET"
            }
        
        elif operation == "security_alerts":
            return {
                **base_response,
                "action": "security_alerts",
                "parameters": {},
                "message": "Retrieving security alerts...",
                "api_endpoint": "/api/security/alerts",
                "method": "GET"
            }
        
        elif operation == "ai_fraud_analysis":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "ai_fraud_analysis",
                "parameters": {"artifact_id": document_id},
                "message": f"Running AI fraud analysis on document {document_id}...",
                "api_endpoint": f"/api/ai/fraud-analysis/{document_id}",
                "method": "GET"
            }
        
        elif operation == "security_score":
            document_id = match.group(1)
            return {
                **base_response,
                "action": "security_score",
                "parameters": {"artifact_id": document_id},
                "message": f"Calculating security score for document {document_id}...",
                "api_endpoint": f"/api/artifacts/{document_id}/security-score",
                "method": "GET"
            }
        
        return base_response

    def get_available_commands(self) -> List[Dict[str, Any]]:
        """Get a list of available voice commands."""
        commands = []
        
        for operation, patterns in self.command_patterns.items():
            commands.append({
                "operation": operation,
                "examples": [pattern.replace(r"(\w+)", "[DOCUMENT_ID]") for pattern in patterns[:2]],
                "description": self._get_operation_description(operation)
            })
        
        return commands

    def _get_operation_description(self, operation: str) -> str:
        """Get a human-readable description of an operation."""
        descriptions = {
            # Original operations
            "create_attestation": "Create a compliance attestation for a document",
            "generate_disclosure": "Generate a regulatory disclosure pack for a document",
            "verify_document": "Verify the integrity and authenticity of a document",
            "show_history": "Show the complete history and timeline of a document",
            "list_attestations": "List all attestations in the system",
            "list_documents": "List all documents in the system",
            "system_status": "Check the current system health and status",
            
            # Bulk Operations Analytics
            "bulk_stats": "View bulk verification statistics and metrics",
            "bulk_stats_timeframe": "View bulk statistics for a specific timeframe",
            "documents_sealed_today": "Check how many documents were sealed today",
            "compliance_success_rate": "View the overall compliance success rate",
            "failed_verifications": "List all failed verification operations",
            "bulk_operations_summary": "Get a comprehensive summary of bulk operations",
            
            # Document Provenance & Time Machine
            "document_lineage": "View the complete lineage chain of a document",
            "document_versions": "View all historical versions of a document",
            "document_last_modified": "Check when a document was last modified",
            "document_creator": "Find out who created a specific document",
            "document_provenance": "View the full provenance chain for a document",
            
            # Security & Tamper Detection
            "quantum_signature": "Verify the quantum-safe signature of a document",
            "tamper_detection": "Check if a document has been tampered with",
            "security_alerts": "List all security alerts and warnings",
            "ai_fraud_analysis": "Run AI-powered fraud analysis on a document",
            "security_score": "View the security score of a document"
        }
        return descriptions.get(operation, "Unknown operation")

    def is_confirmation(self, text: str) -> bool:
        """Check if the text is a confirmation."""
        return any(phrase in text.lower() for phrase in self.confirmation_phrases)

    def is_cancellation(self, text: str) -> bool:
        """Check if the text is a cancellation."""
        return any(phrase in text.lower() for phrase in self.cancellation_phrases)

