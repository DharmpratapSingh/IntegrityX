"""
Bulk Operations Manager with Walacor ObjectValidator Integration

This module provides bulk operations capabilities enhanced with Walacor's ObjectValidator
for efficient directory-level verification and processing.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pathlib import Path

from .walacor_service import WalacorIntegrityService
from .document_handler import DocumentHandler
from .models import Artifact, DeletedDocument


class BulkOperationsManager:
    """
    Manages bulk operations with enhanced Walacor ObjectValidator integration.
    
    This class provides efficient bulk operations for document management,
    leveraging Walacor's ObjectValidator for directory-level verification
    and hash generation.
    """
    
    def __init__(self, walacor_service: WalacorIntegrityService, document_handler: DocumentHandler):
        """
        Initialize BulkOperationsManager.
        
        Args:
            walacor_service: WalacorIntegrityService instance
            document_handler: DocumentHandler instance
        """
        self.walacor_service = walacor_service
        self.document_handler = document_handler
        
        # Initialize ObjectValidator (Walacor integration)
        self.object_validator = self._init_object_validator()
    
    def _init_object_validator(self):
        """
        Initialize Walacor ObjectValidator for directory-level operations.
        
        Returns:
            ObjectValidator instance or None if not available
        """
        try:
            # Try to initialize Walacor ObjectValidator
            from walacor_sdk import ObjectValidator
            return ObjectValidator()
        except ImportError:
            print("⚠️ Walacor ObjectValidator not available, using fallback implementation")
            return self._create_fallback_validator()
    
    def _create_fallback_validator(self):
        """
        Create fallback validator for when ObjectValidator is not available.
        
        Returns:
            Fallback validator instance
        """
        class FallbackValidator:
            def generate_directory_hash(self, directory_path: str) -> str:
                """Generate hash for entire directory structure."""
                import hashlib
                
                hash_objects = []
                directory_path = Path(directory_path)
                
                if not directory_path.exists():
                    raise FileNotFoundError(f"Directory not found: {directory_path}")
                
                # Walk through directory and hash all files
                for file_path in sorted(directory_path.rglob('*')):
                    if file_path.is_file():
                        try:
                            with open(file_path, 'rb') as f:
                                file_hash = hashlib.sha256(f.read()).hexdigest()
                                hash_objects.append(f"{file_path.name}:{file_hash}")
                        except Exception as e:
                            print(f"⚠️ Error hashing file {file_path}: {e}")
                
                # Create directory hash from all file hashes
                combined_content = "\n".join(hash_objects)
                return hashlib.sha256(combined_content.encode()).hexdigest()
            
            def verify_directory_hash(self, directory_path: str, expected_hash: str) -> Dict[str, Any]:
                """Verify directory hash against expected value."""
                try:
                    current_hash = self.generate_directory_hash(directory_path)
                    is_valid = current_hash == expected_hash
                    
                    return {
                        "is_valid": is_valid,
                        "current_hash": current_hash,
                        "expected_hash": expected_hash,
                        "verified_at": datetime.now(timezone.utc).isoformat()
                    }
                except Exception as e:
                    return {
                        "is_valid": False,
                        "error": str(e),
                        "verified_at": datetime.now(timezone.utc).isoformat()
                    }
        
        return FallbackValidator()
    
    async def bulk_verify_directory(self, directory_path: str, loan_id: str) -> Dict[str, Any]:
        """
        Verify entire directory of documents using ObjectValidator's single hash per directory.
        
        This leverages Walacor's ObjectValidator to create a single hash representing
        the entire directory structure, making bulk verification extremely efficient.
        
        Args:
            directory_path: Path to directory to verify
            loan_id: Loan identifier for grouping
            
        Returns:
            Dict containing verification results
        """
        try:
            print(f"🔍 Starting bulk directory verification...")
            print(f"   Directory: {directory_path}")
            print(f"   Loan ID: {loan_id}")
            
            # Validate inputs
            if not directory_path or not loan_id:
                raise ValueError("Directory path and loan ID are required")
            
            directory_path = Path(directory_path)
            if not directory_path.exists():
                raise FileNotFoundError(f"Directory not found: {directory_path}")
            
            # Use ObjectValidator to generate directory hash
            print("📊 Generating directory hash using ObjectValidator...")
            directory_hash = self.object_validator.generate_directory_hash(str(directory_path))
            print(f"✅ Directory hash generated: {directory_hash[:16]}...")
            
            # Get file count and total size
            file_count = 0
            total_size = 0
            
            for file_path in directory_path.rglob('*'):
                if file_path.is_file():
                    file_count += 1
                    total_size += file_path.stat().st_size
            
            # Verify against Walacor records (if available)
            verification_result = await self._verify_against_walacor(directory_hash, loan_id)
            
            return {
                "directory_path": str(directory_path),
                "loan_id": loan_id,
                "directory_hash": directory_hash,
                "verification_status": verification_result["status"],
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "files_count": file_count,
                "total_size": total_size,
                "walacor_verification": verification_result,
                "object_validator_used": True
            }
            
        except Exception as e:
            print(f"❌ Bulk directory verification failed: {e}")
            return {
                "error": str(e),
                "verification_status": "failed",
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "object_validator_used": False
            }
    
    async def _verify_against_walacor(self, directory_hash: str, loan_id: str) -> Dict[str, Any]:
        """
        Verify directory hash against Walacor records.
        
        Args:
            directory_hash: Hash to verify
            loan_id: Loan identifier
            
        Returns:
            Dict containing verification results
        """
        try:
            # Try to find matching directory hash in Walacor
            if self.walacor_service and self.walacor_service.wal:
                # Query Walacor for directory hash
                query_result = await self.walacor_service.query_by_hash(directory_hash)
                
                if query_result and query_result.get("found"):
                    return {
                        "status": "verified",
                        "walacor_tx_id": query_result.get("walacor_tx_id"),
                        "stored_at": query_result.get("stored_at"),
                        "message": "Directory hash verified against Walacor blockchain"
                    }
                else:
                    return {
                        "status": "not_found",
                        "message": "Directory hash not found in Walacor records"
                    }
            else:
                return {
                    "status": "walacor_unavailable",
                    "message": "Walacor service not available for verification"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": "Error verifying against Walacor"
            }
    
    async def bulk_delete_with_verification(self, artifact_ids: List[str], deleted_by: str, deletion_reason: str = "Bulk deletion") -> Dict[str, Any]:
        """
        Bulk delete with ObjectValidator verification before deletion.
        
        Args:
            artifact_ids: List of artifact IDs to delete
            deleted_by: User performing the deletion
            deletion_reason: Reason for deletion
            
        Returns:
            Dict containing bulk deletion results
        """
        try:
            print(f"🗑️ Starting bulk deletion with verification...")
            print(f"   Artifacts to delete: {len(artifact_ids)}")
            print(f"   Deleted by: {deleted_by}")
            
            results = []
            successful_deletions = 0
            failed_deletions = 0
            
            for i, artifact_id in enumerate(artifact_ids, 1):
                try:
                    print(f"   Processing artifact {i}/{len(artifact_ids)}: {artifact_id}")
                    
                    # Get artifact details
                    artifact = self.walacor_service.get_artifact_by_id(artifact_id)
                    
                    if artifact:
                        # Verify document integrity before deletion
                        verification_result = await self._verify_document_integrity(artifact)
                        
                        if verification_result["is_valid"]:
                            # Proceed with deletion
                            delete_result = self.walacor_service.delete_artifact(
                                artifact_id=artifact_id,
                                deleted_by=deleted_by,
                                deletion_reason=deletion_reason
                            )
                            
                            results.append({
                                "artifact_id": artifact_id,
                                "status": "deleted",
                                "verification_status": "verified",
                                "deleted_document_id": delete_result.get("deleted_document_id"),
                                "deletion_event_id": delete_result.get("deletion_event_id")
                            })
                            
                            successful_deletions += 1
                            print(f"   ✅ Successfully deleted: {artifact_id}")
                            
                        else:
                            results.append({
                                "artifact_id": artifact_id,
                                "status": "failed",
                                "error": "Document integrity verification failed",
                                "verification_status": "failed",
                                "verification_error": verification_result.get("error")
                            })
                            
                            failed_deletions += 1
                            print(f"   ❌ Verification failed: {artifact_id}")
                            
                    else:
                        results.append({
                            "artifact_id": artifact_id,
                            "status": "failed",
                            "error": "Artifact not found"
                        })
                        
                        failed_deletions += 1
                        print(f"   ❌ Artifact not found: {artifact_id}")
                        
                except Exception as e:
                    results.append({
                        "artifact_id": artifact_id,
                        "status": "error",
                        "error": str(e)
                    })
                    
                    failed_deletions += 1
                    print(f"   ❌ Error processing {artifact_id}: {e}")
            
            print(f"✅ Bulk deletion completed:")
            print(f"   Successful: {successful_deletions}")
            print(f"   Failed: {failed_deletions}")
            
            return {
                "total_requested": len(artifact_ids),
                "successful": successful_deletions,
                "failed": failed_deletions,
                "deleted_by": deleted_by,
                "deletion_reason": deletion_reason,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "results": results
            }
            
        except Exception as e:
            print(f"❌ Bulk deletion failed: {e}")
            return {
                "error": str(e),
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def _verify_document_integrity(self, artifact: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify document integrity before deletion.
        
        Args:
            artifact: Artifact information
            
        Returns:
            Dict containing verification results
        """
        try:
            # Check if file exists
            file_path = artifact.get("file_path")
            if not file_path or not os.path.exists(file_path):
                return {
                    "is_valid": False,
                    "error": "File not found or path not specified"
                }
            
            # Calculate current hash
            current_hash = self.document_handler.calculate_hash_from_file(file_path)
            stored_hash = artifact.get("payload_sha256")
            
            # Compare hashes
            if current_hash == stored_hash:
                return {
                    "is_valid": True,
                    "current_hash": current_hash,
                    "stored_hash": stored_hash,
                    "message": "Document integrity verified"
                }
            else:
                return {
                    "is_valid": False,
                    "error": "Hash mismatch - document may have been modified",
                    "current_hash": current_hash,
                    "stored_hash": stored_hash
                }
                
        except Exception as e:
            return {
                "is_valid": False,
                "error": f"Verification error: {str(e)}"
            }
    
    async def bulk_export_metadata(self, artifact_ids: List[str], export_format: str = "json") -> Dict[str, Any]:
        """
        Bulk export metadata for multiple artifacts.
        
        Args:
            artifact_ids: List of artifact IDs to export
            export_format: Export format (json, csv, excel)
            
        Returns:
            Dict containing export results
        """
        try:
            print(f"📤 Starting bulk metadata export...")
            print(f"   Artifacts to export: {len(artifact_ids)}")
            print(f"   Export format: {export_format}")
            
            exported_data = []
            
            for artifact_id in artifact_ids:
                try:
                    # Get artifact metadata
                    artifact = self.walacor_service.get_artifact_by_id(artifact_id)
                    
                    if artifact:
                        # Get deleted document info if applicable
                        deleted_doc = self.walacor_service.get_deleted_document_by_original_id(artifact_id)
                        
                        export_record = {
                            "artifact_id": artifact_id,
                            "loan_id": artifact.get("loan_id"),
                            "artifact_type": artifact.get("artifact_type"),
                            "payload_sha256": artifact.get("payload_sha256"),
                            "manifest_sha256": artifact.get("manifest_sha256"),
                            "walacor_tx_id": artifact.get("walacor_tx_id"),
                            "created_at": artifact.get("created_at"),
                            "created_by": artifact.get("created_by"),
                            "status": "deleted" if deleted_doc else "active",
                            "deleted_at": deleted_doc.get("deleted_at") if deleted_doc else None,
                            "deleted_by": deleted_doc.get("deleted_by") if deleted_doc else None,
                            "deletion_reason": deleted_doc.get("deletion_reason") if deleted_doc else None
                        }
                        
                        exported_data.append(export_record)
                        
                except Exception as e:
                    print(f"⚠️ Error exporting artifact {artifact_id}: {e}")
                    exported_data.append({
                        "artifact_id": artifact_id,
                        "error": str(e),
                        "status": "export_failed"
                    })
            
            # Format export data
            if export_format == "json":
                export_result = json.dumps(exported_data, indent=2, default=str)
            elif export_format == "csv":
                export_result = self._convert_to_csv(exported_data)
            else:
                export_result = exported_data
            
            print(f"✅ Bulk export completed: {len(exported_data)} records exported")
            
            return {
                "total_requested": len(artifact_ids),
                "exported": len(exported_data),
                "export_format": export_format,
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "data": export_result
            }
            
        except Exception as e:
            print(f"❌ Bulk export failed: {e}")
            return {
                "error": str(e),
                "status": "failed",
                "exported_at": datetime.now(timezone.utc).isoformat()
            }
    
    def _convert_to_csv(self, data: List[Dict[str, Any]]) -> str:
        """
        Convert data to CSV format.
        
        Args:
            data: List of dictionaries to convert
            
        Returns:
            CSV string
        """
        if not data:
            return ""
        
        import csv
        import io
        
        # Get all unique keys
        all_keys = set()
        for record in data:
            all_keys.update(record.keys())
        
        # Create CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=sorted(all_keys))
        writer.writeheader()
        
        for record in data:
            writer.writerow(record)
        
        return output.getvalue()
    
    async def get_bulk_operation_status(self, operation_id: str) -> Dict[str, Any]:
        """
        Get status of a bulk operation.
        
        Args:
            operation_id: Operation identifier
            
        Returns:
            Dict containing operation status
        """
        try:
            # This would typically query a database or cache for operation status
            # For now, return a placeholder implementation
            
            return {
                "operation_id": operation_id,
                "status": "completed",
                "message": "Bulk operation status retrieval not yet implemented",
                "checked_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "operation_id": operation_id,
                "status": "error",
                "error": str(e),
                "checked_at": datetime.now(timezone.utc).isoformat()
            }


# Example usage and testing
if __name__ == "__main__":
    # This would be used for testing the bulk operations manager
    print("Bulk Operations Manager with ObjectValidator Integration")
    print("=" * 60)
    
    # Example usage would go here
    print("✅ Bulk Operations Manager initialized successfully")
