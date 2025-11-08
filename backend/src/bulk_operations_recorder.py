"""
Bulk Operations Recorder

Helper module for recording bulk operations to the database for analytics tracking.
Use this when performing bulk operations to automatically track metrics.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
import logging
import time

logger = logging.getLogger(__name__)


class BulkOperationRecorder:
    """
    Records bulk operations to the database for analytics tracking.
    
    Example usage:
        recorder = BulkOperationRecorder(db_service)
        
        # Start recording
        recorder.start('bulk_verify', documents_count=50, user_id='user@example.com')
        
        # ... perform bulk operation ...
        
        # Finish recording
        recorder.finish(success_count=48, failure_count=2)
    """
    
    def __init__(self, db_service=None):
        """
        Initialize the recorder with database service.
        
        Args:
            db_service: Database service instance
        """
        self.db_service = db_service
        self.operation_id = None
        self.start_time = None
        self.operation_data = {}
    
    def start(
        self,
        operation_type: str,
        documents_count: int = 0,
        user_id: Optional[str] = None,
        operation_subtype: Optional[str] = None,
        operation_metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Start recording a bulk operation.
        
        Args:
            operation_type: Type of operation ('bulk_verify', 'bulk_delete', 'bulk_export', etc.)
            documents_count: Number of documents being processed
            user_id: User performing the operation
            operation_subtype: More specific operation type
            operation_metadata: Additional metadata
        """
        self.start_time = time.time()
        self.operation_data = {
            'operation_type': operation_type,
            'operation_subtype': operation_subtype,
            'documents_count': documents_count,
            'user_id': user_id,
            'operation_metadata': operation_metadata or {}
        }
        
        logger.info(f"Started recording bulk operation: {operation_type}, docs={documents_count}")
    
    def finish(
        self,
        success_count: int = 0,
        failure_count: int = 0,
        success: str = 'success'
    ) -> Optional[str]:
        """
        Finish recording and save to database.
        
        Args:
            success_count: Number of successful operations
            failure_count: Number of failed operations
            success: Overall success status ('success', 'partial', 'failed')
            
        Returns:
            Operation ID if saved successfully, None otherwise
        """
        if not self.start_time:
            logger.warning("Cannot finish recording - no operation started")
            return None
        
        execution_time_ms = int((time.time() - self.start_time) * 1000)
        
        # Determine success status
        if success_count == 0 and failure_count > 0:
            success = 'failed'
        elif failure_count > 0:
            success = 'partial'
        else:
            success = 'success'
        
        try:
            if self.db_service:
                from .models import BulkOperation
                import uuid
                
                operation = BulkOperation(
                    id=str(uuid.uuid4()),
                    operation_type=self.operation_data.get('operation_type'),
                    operation_subtype=self.operation_data.get('operation_subtype'),
                    documents_count=self.operation_data.get('documents_count', 0),
                    success_count=success_count,
                    failure_count=failure_count,
                    success=success,
                    execution_time_ms=execution_time_ms,
                    user_id=self.operation_data.get('user_id'),
                    operation_metadata=self.operation_data.get('operation_metadata'),
                    created_at=datetime.now(timezone.utc)
                )
                
                with self.db_service.get_session() as session:
                    session.add(operation)
                    session.commit()
                    operation_id = operation.id
                
                logger.info(
                    f"Recorded bulk operation: {self.operation_data.get('operation_type')}, "
                    f"docs={self.operation_data.get('documents_count')}, "
                    f"success={success_count}, failed={failure_count}, time={execution_time_ms}ms"
                )
                
                # Reset for next operation
                self.start_time = None
                self.operation_data = {}
                
                return operation_id
            else:
                logger.warning("No database service available - operation not recorded")
                return None
                
        except Exception as e:
            logger.error(f"Failed to record bulk operation: {e}")
            return None


# Convenience function for one-time recording
def record_bulk_operation(
    db_service,
    operation_type: str,
    documents_count: int,
    success_count: int = 0,
    failure_count: int = 0,
    execution_time_ms: Optional[int] = None,
    user_id: Optional[str] = None,
    operation_subtype: Optional[str] = None,
    operation_metadata: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Record a bulk operation directly without using start/finish pattern.
    
    Args:
        db_service: Database service instance
        operation_type: Type of operation
        documents_count: Number of documents processed
        success_count: Number of successful operations
        failure_count: Number of failed operations
        execution_time_ms: Execution time in milliseconds
        user_id: User who performed the operation
        operation_subtype: More specific operation type
        operation_metadata: Additional metadata
        
    Returns:
        Operation ID if saved successfully, None otherwise
    """
    try:
        if not db_service:
            logger.warning("No database service provided")
            return None
        
        from .models import BulkOperation
        import uuid
        
        # Determine success status
        if success_count == 0 and failure_count > 0:
            success = 'failed'
        elif failure_count > 0:
            success = 'partial'
        else:
            success = 'success'
        
        operation = BulkOperation(
            id=str(uuid.uuid4()),
            operation_type=operation_type,
            operation_subtype=operation_subtype,
            documents_count=documents_count,
            success_count=success_count,
            failure_count=failure_count,
            success=success,
            execution_time_ms=execution_time_ms,
            user_id=user_id,
            operation_metadata=operation_metadata,
            created_at=datetime.now(timezone.utc)
        )
        
        with db_service.get_session() as session:
            session.add(operation)
            session.commit()
            
        logger.info(f"Recorded bulk operation: {operation_type}, docs={documents_count}")
        return operation.id
        
    except Exception as e:
        logger.error(f"Failed to record bulk operation: {e}")
        return None


# Example usage function
def example_usage():
    """
    Example of how to use the bulk operation recorder.
    """
    from .database import Database
    
    db = Database()
    recorder = BulkOperationRecorder(db)
    
    # Method 1: Using start/finish pattern
    recorder.start(
        operation_type='bulk_verify',
        documents_count=100,
        user_id='user@example.com',
        operation_metadata={'source': 'api', 'batch_id': 'BATCH_001'}
    )
    
    # ... perform bulk verification ...
    success_count = 98
    failure_count = 2
    
    recorder.finish(
        success_count=success_count,
        failure_count=failure_count
    )
    
    # Method 2: Direct recording
    record_bulk_operation(
        db_service=db,
        operation_type='bulk_export',
        documents_count=50,
        success_count=50,
        failure_count=0,
        execution_time_ms=1500,
        user_id='admin@example.com',
        operation_metadata={'format': 'pdf', 'destination': 's3://bucket/exports'}
    )

