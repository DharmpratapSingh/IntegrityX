"""
Bulk Operations API Endpoints

This module provides API endpoints for bulk operations with ObjectValidator integration.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.bulk_operations_manager import BulkOperationsManager
from src.walacor_service import WalacorIntegrityService
from src.document_handler import DocumentHandler


# Pydantic models for bulk operations
class BulkVerifyDirectoryRequest(BaseModel):
    """Request model for bulk directory verification."""
    directory_path: str
    loan_id: str


class BulkDeleteRequest(BaseModel):
    """Request model for bulk deletion."""
    artifact_ids: List[str]
    deleted_by: str
    deletion_reason: str = "Bulk deletion"


class BulkExportRequest(BaseModel):
    """Request model for bulk export."""
    artifact_ids: List[str]
    export_format: str = "json"  # json, csv, excel


class BulkOperationResponse(BaseModel):
    """Response model for bulk operations."""
    operation_id: str
    status: str
    message: str
    total_requested: int
    successful: int
    failed: int
    completed_at: str
    results: Optional[List[Dict[str, Any]]] = None


class BulkVerifyDirectoryResponse(BaseModel):
    """Response model for directory verification."""
    directory_path: str
    loan_id: str
    directory_hash: str
    verification_status: str
    verified_at: str
    files_count: int
    total_size: int
    object_validator_used: bool
    walacor_verification: Dict[str, Any]


# Create router
router = APIRouter(prefix="/api/bulk", tags=["bulk-operations"])


def get_bulk_operations_manager() -> BulkOperationsManager:
    """Dependency to get BulkOperationsManager instance."""
    try:
        # Initialize services
        walacor_service = WalacorIntegrityService()
        document_handler = DocumentHandler()
        
        # Create bulk operations manager
        bulk_manager = BulkOperationsManager(walacor_service, document_handler)
        
        return bulk_manager
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize bulk operations manager: {str(e)}")


@router.post("/verify-directory", response_model=BulkVerifyDirectoryResponse)
async def bulk_verify_directory(
    request: BulkVerifyDirectoryRequest,
    bulk_manager: BulkOperationsManager = Depends(get_bulk_operations_manager)
):
    """
    Verify entire directory of documents using ObjectValidator.
    
    This endpoint leverages Walacor's ObjectValidator to create a single hash
    representing the entire directory structure, making bulk verification
    extremely efficient.
    """
    try:
        print(f"🔍 Bulk directory verification requested:")
        print(f"   Directory: {request.directory_path}")
        print(f"   Loan ID: {request.loan_id}")
        
        # Perform bulk directory verification
        result = await bulk_manager.bulk_verify_directory(
            directory_path=request.directory_path,
            loan_id=request.loan_id
        )
        
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        
        return BulkVerifyDirectoryResponse(
            directory_path=result["directory_path"],
            loan_id=result["loan_id"],
            directory_hash=result["directory_hash"],
            verification_status=result["verification_status"],
            verified_at=result["verified_at"],
            files_count=result["files_count"],
            total_size=result["total_size"],
            object_validator_used=result["object_validator_used"],
            walacor_verification=result["walacor_verification"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk directory verification failed: {str(e)}")


@router.post("/delete", response_model=BulkOperationResponse)
async def bulk_delete_artifacts(
    request: BulkDeleteRequest,
    background_tasks: BackgroundTasks,
    bulk_manager: BulkOperationsManager = Depends(get_bulk_operations_manager)
):
    """
    Delete multiple artifacts in bulk with verification.
    
    This endpoint performs bulk deletion with ObjectValidator verification
    before each deletion to ensure document integrity.
    """
    try:
        print(f"🗑️ Bulk deletion requested:")
        print(f"   Artifacts: {len(request.artifact_ids)}")
        print(f"   Deleted by: {request.deleted_by}")
        
        # Validate inputs
        if not request.artifact_ids:
            raise HTTPException(status_code=400, detail="No artifact IDs provided")
        
        if not request.deleted_by:
            raise HTTPException(status_code=400, detail="deleted_by is required")
        
        # Perform bulk deletion
        result = await bulk_manager.bulk_delete_with_verification(
            artifact_ids=request.artifact_ids,
            deleted_by=request.deleted_by,
            deletion_reason=request.deletion_reason
        )
        
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Generate operation ID
        operation_id = f"bulk_delete_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(request.artifact_ids)}"
        
        return BulkOperationResponse(
            operation_id=operation_id,
            status="completed",
            message=f"Bulk deletion completed: {result['successful']} successful, {result['failed']} failed",
            total_requested=result["total_requested"],
            successful=result["successful"],
            failed=result["failed"],
            completed_at=result["completed_at"],
            results=result["results"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk deletion failed: {str(e)}")


@router.post("/export", response_model=BulkOperationResponse)
async def bulk_export_metadata(
    request: BulkExportRequest,
    bulk_manager: BulkOperationsManager = Depends(get_bulk_operations_manager)
):
    """
    Export metadata for multiple artifacts in bulk.
    
    This endpoint exports metadata for multiple artifacts in various formats
    (JSON, CSV, Excel) for analysis and reporting purposes.
    """
    try:
        print(f"📤 Bulk export requested:")
        print(f"   Artifacts: {len(request.artifact_ids)}")
        print(f"   Format: {request.export_format}")
        
        # Validate inputs
        if not request.artifact_ids:
            raise HTTPException(status_code=400, detail="No artifact IDs provided")
        
        if request.export_format not in ["json", "csv", "excel"]:
            raise HTTPException(status_code=400, detail="Invalid export format. Supported: json, csv, excel")
        
        # Perform bulk export
        result = await bulk_manager.bulk_export_metadata(
            artifact_ids=request.artifact_ids,
            export_format=request.export_format
        )
        
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Generate operation ID
        operation_id = f"bulk_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(request.artifact_ids)}"
        
        return BulkOperationResponse(
            operation_id=operation_id,
            status="completed",
            message=f"Bulk export completed: {result['exported']} records exported",
            total_requested=result["total_requested"],
            successful=result["exported"],
            failed=result["total_requested"] - result["exported"],
            completed_at=result["exported_at"],
            results=[{"export_data": result["data"]}] if result.get("data") else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk export failed: {str(e)}")


@router.get("/operation/{operation_id}")
async def get_bulk_operation_status(
    operation_id: str,
    bulk_manager: BulkOperationsManager = Depends(get_bulk_operations_manager)
):
    """
    Get status of a bulk operation.
    
    This endpoint retrieves the status and results of a bulk operation
    by its operation ID.
    """
    try:
        print(f"📊 Bulk operation status requested: {operation_id}")
        
        # Get operation status
        result = await bulk_manager.get_bulk_operation_status(operation_id)
        
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get operation status: {str(e)}")


@router.get("/health")
async def bulk_operations_health():
    """
    Health check for bulk operations endpoints.
    
    This endpoint provides a health check for the bulk operations API.
    """
    try:
        return {
            "status": "healthy",
            "service": "bulk-operations",
            "timestamp": datetime.now().isoformat(),
            "features": [
                "bulk_verify_directory",
                "bulk_delete_artifacts",
                "bulk_export_metadata",
                "object_validator_integration"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# Additional utility endpoints
@router.post("/verify-multiple-directories")
async def verify_multiple_directories(
    directories: List[BulkVerifyDirectoryRequest],
    bulk_manager: BulkOperationsManager = Depends(get_bulk_operations_manager)
):
    """
    Verify multiple directories in bulk.
    
    This endpoint allows verification of multiple directories in a single request,
    useful for batch processing of loan document directories.
    """
    try:
        print(f"🔍 Multiple directory verification requested: {len(directories)} directories")
        
        results = []
        
        for directory_request in directories:
            try:
                result = await bulk_manager.bulk_verify_directory(
                    directory_path=directory_request.directory_path,
                    loan_id=directory_request.loan_id
                )
                results.append(result)
            except Exception as e:
                results.append({
                    "directory_path": directory_request.directory_path,
                    "loan_id": directory_request.loan_id,
                    "error": str(e),
                    "verification_status": "failed"
                })
        
        return {
            "total_directories": len(directories),
            "successful": len([r for r in results if r.get("verification_status") != "failed"]),
            "failed": len([r for r in results if r.get("verification_status") == "failed"]),
            "results": results,
            "completed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multiple directory verification failed: {str(e)}")


@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported export formats.
    
    This endpoint returns the list of supported export formats for bulk operations.
    """
    return {
        "supported_formats": [
            {
                "format": "json",
                "description": "JSON format with full metadata",
                "mime_type": "application/json"
            },
            {
                "format": "csv",
                "description": "CSV format for spreadsheet applications",
                "mime_type": "text/csv"
            },
            {
                "format": "excel",
                "description": "Excel format with multiple sheets",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        ],
        "default_format": "json"
    }


# Example usage documentation
@router.get("/examples")
async def get_usage_examples():
    """
    Get usage examples for bulk operations endpoints.
    
    This endpoint provides example requests and responses for bulk operations.
    """
    return {
        "examples": {
            "bulk_verify_directory": {
                "request": {
                    "directory_path": "/path/to/loan/documents",
                    "loan_id": "LOAN_2024_001"
                },
                "response": {
                    "directory_path": "/path/to/loan/documents",
                    "loan_id": "LOAN_2024_001",
                    "directory_hash": "abc123...",
                    "verification_status": "verified",
                    "verified_at": "2024-01-01T12:00:00Z",
                    "files_count": 15,
                    "total_size": 2048000,
                    "object_validator_used": True
                }
            },
            "bulk_delete_artifacts": {
                "request": {
                    "artifact_ids": ["artifact1", "artifact2", "artifact3"],
                    "deleted_by": "user@example.com",
                    "deletion_reason": "Bulk cleanup"
                },
                "response": {
                    "operation_id": "bulk_delete_20240101_120000_3",
                    "status": "completed",
                    "total_requested": 3,
                    "successful": 3,
                    "failed": 0,
                    "completed_at": "2024-01-01T12:00:00Z"
                }
            },
            "bulk_export_metadata": {
                "request": {
                    "artifact_ids": ["artifact1", "artifact2"],
                    "export_format": "csv"
                },
                "response": {
                    "operation_id": "bulk_export_20240101_120000_2",
                    "status": "completed",
                    "total_requested": 2,
                    "successful": 2,
                    "failed": 0,
                    "completed_at": "2024-01-01T12:00:00Z"
                }
            }
        }
    }
