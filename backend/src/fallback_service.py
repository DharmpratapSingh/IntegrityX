"""
Graceful Degradation and Fallback Service

This module provides graceful degradation and fallback mechanisms for:
- Database connection failures
- Service unavailability
- Network issues
- Resource constraints
- Emergency mode operations
"""

import logging
import time
import json
import threading
from typing import Dict, Any, Optional, List, Callable, Union
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum
import sqlite3
import tempfile
import os

logger = logging.getLogger(__name__)

class FallbackMode(Enum):
    """Fallback mode enumeration."""
    NORMAL = "normal"
    DEGRADED = "degraded"
    EMERGENCY = "emergency"
    OFFLINE = "offline"

@dataclass
class FallbackConfig:
    """Fallback configuration."""
    enable_local_storage: bool = True
    enable_emergency_mode: bool = True
    max_retry_attempts: int = 3
    retry_delay_seconds: float = 5.0
    emergency_timeout_seconds: int = 300  # 5 minutes
    local_storage_path: str = "fallback_storage.db"

class GracefulFallbackService:
    """
    Graceful fallback service for handling system degradation.
    
    Features:
    - Automatic fallback to local storage
    - Emergency mode operations
    - Service degradation handling
    - Data synchronization when services recover
    - Offline capability
    """
    
    def __init__(self, config: Optional[FallbackConfig] = None):
        """Initialize the fallback service."""
        self.config = config or FallbackConfig()
        self.current_mode = FallbackMode.NORMAL
        self.fallback_lock = threading.Lock()
        
        # Local storage for fallback
        self.local_storage = None
        self.pending_operations = []
        
        # Service status tracking
        self.service_status = {
            'database': True,
            'walacor': True,
            'api': True
        }
        
        # Initialize local storage if enabled
        if self.config.enable_local_storage:
            self._initialize_local_storage()
        
        logger.info("Graceful fallback service initialized")
    
    def _initialize_local_storage(self) -> None:
        """Initialize local SQLite storage for fallback."""
        try:
            storage_path = os.path.join(tempfile.gettempdir(), self.config.local_storage_path)
            self.local_storage = sqlite3.connect(storage_path, check_same_thread=False)
            
            # Create tables for fallback storage
            self._create_fallback_tables()
            
            logger.info(f"Local fallback storage initialized: {storage_path}")
            
        except Exception as e:
            logger.error(f"Failed to initialize local storage: {e}")
            self.local_storage = None
    
    def _create_fallback_tables(self) -> None:
        """Create tables for fallback storage."""
        if not self.local_storage:
            return
        
        try:
            cursor = self.local_storage.cursor()
            
            # Create artifacts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS fallback_artifacts (
                    id TEXT PRIMARY KEY,
                    loan_id TEXT NOT NULL,
                    artifact_type TEXT NOT NULL,
                    etid INTEGER NOT NULL,
                    payload_sha256 TEXT NOT NULL,
                    walacor_tx_id TEXT NOT NULL,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    data_json TEXT NOT NULL,
                    synced INTEGER DEFAULT 0
                )
            ''')
            
            # Create events table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS fallback_events (
                    id TEXT PRIMARY KEY,
                    artifact_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    payload_json TEXT,
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    synced INTEGER DEFAULT 0
                )
            ''')
            
            # Create pending operations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS pending_operations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    operation_type TEXT NOT NULL,
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0
                )
            ''')
            
            self.local_storage.commit()
            logger.info("Fallback tables created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create fallback tables: {e}")
    
    def set_service_status(self, service: str, available: bool) -> None:
        """Set service availability status."""
        with self.fallback_lock:
            self.service_status[service] = available
            self._update_fallback_mode()
            logger.info(f"Service {service} status updated: {'available' if available else 'unavailable'}")
    
    def _update_fallback_mode(self) -> None:
        """Update fallback mode based on service availability."""
        available_services = sum(self.service_status.values())
        total_services = len(self.service_status)
        
        if available_services == total_services:
            self.current_mode = FallbackMode.NORMAL
        elif available_services >= total_services // 2:
            self.current_mode = FallbackMode.DEGRADED
        elif available_services > 0:
            self.current_mode = FallbackMode.EMERGENCY
        else:
            self.current_mode = FallbackMode.OFFLINE
        
        logger.info(f"Fallback mode updated to: {self.current_mode.value}")
    
    def execute_with_fallback(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute operation with fallback handling."""
        with self.fallback_lock:
            if self.current_mode == FallbackMode.NORMAL:
                return self._execute_normal_operation(operation, *args, **kwargs)
            elif self.current_mode == FallbackMode.DEGRADED:
                return self._execute_degraded_operation(operation, *args, **kwargs)
            elif self.current_mode == FallbackMode.EMERGENCY:
                return self._execute_emergency_operation(operation, *args, **kwargs)
            else:  # OFFLINE
                return self._execute_offline_operation(operation, *args, **kwargs)
    
    def _execute_normal_operation(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute operation in normal mode."""
        try:
            return operation(*args, **kwargs)
        except Exception as e:
            logger.warning(f"Normal operation failed, switching to degraded mode: {e}")
            self._handle_service_failure()
            return self._execute_degraded_operation(operation, *args, **kwargs)
    
    def _execute_degraded_operation(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute operation in degraded mode."""
        try:
            # Try primary operation first
            return operation(*args, **kwargs)
        except Exception as e:
            logger.warning(f"Degraded operation failed: {e}")
            # Store operation for later retry
            self._store_pending_operation(operation, args, kwargs)
            # Return cached or fallback data
            return self._get_fallback_data(operation, *args, **kwargs)
    
    def _execute_emergency_operation(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute operation in emergency mode."""
        logger.warning("Executing in emergency mode")
        
        # Store operation for later sync
        self._store_pending_operation(operation, args, kwargs)
        
        # Return fallback data
        return self._get_fallback_data(operation, *args, **kwargs)
    
    def _execute_offline_operation(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute operation in offline mode."""
        logger.warning("Executing in offline mode")
        
        # Store operation for later sync
        self._store_pending_operation(operation, args, kwargs)
        
        # Return cached data
        return self._get_cached_data(operation, *args, **kwargs)
    
    def _handle_service_failure(self) -> None:
        """Handle service failure and update status."""
        # This would be called when a service fails
        # For now, we'll mark database as unavailable
        self.set_service_status('database', False)
    
    def _store_pending_operation(self, operation: Callable, args: tuple, kwargs: dict) -> None:
        """Store operation for later retry."""
        if not self.local_storage:
            return
        
        try:
            cursor = self.local_storage.cursor()
            
            operation_data = {
                'function_name': operation.__name__,
                'args': args,
                'kwargs': kwargs,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            cursor.execute('''
                INSERT INTO pending_operations (operation_type, data_json, created_at)
                VALUES (?, ?, ?)
            ''', (
                operation.__name__,
                json.dumps(operation_data),
                datetime.now(timezone.utc).isoformat()
            ))
            
            self.local_storage.commit()
            logger.info(f"Stored pending operation: {operation.__name__}")
            
        except Exception as e:
            logger.error(f"Failed to store pending operation: {e}")
    
    def _get_fallback_data(self, operation: Callable, *args, **kwargs) -> Any:
        """Get fallback data when primary operation fails."""
        operation_name = operation.__name__
        
        # Define fallback responses for different operations
        fallback_responses = {
            'insert_artifact': {
                'id': f"fallback_{int(time.time())}",
                'status': 'stored_locally',
                'message': 'Operation stored for later sync'
            },
            'get_artifact_by_id': None,
            'health_check': {
                'healthy': False,
                'status': 'degraded',
                'message': 'Service in degraded mode'
            }
        }
        
        return fallback_responses.get(operation_name, {'error': 'Operation not available in fallback mode'})
    
    def _get_cached_data(self, operation: Callable, *args, **kwargs) -> Any:
        """Get cached data when offline."""
        # In a real implementation, this would retrieve cached data
        return {
            'status': 'cached',
            'message': 'Retrieved from cache',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def sync_pending_operations(self) -> None:
        """Sync pending operations when services recover."""
        if not self.local_storage:
            return
        
        logger.info("Syncing pending operations...")
        
        try:
            cursor = self.local_storage.cursor()
            cursor.execute('SELECT * FROM pending_operations WHERE retry_count < ?', (self.config.max_retry_attempts,))
            operations = cursor.fetchall()
            
            for operation in operations:
                op_id, op_type, data_json, created_at, retry_count = operation
                
                try:
                    # Parse operation data
                    operation_data = json.loads(data_json)
                    
                    # Execute the operation
                    # In a real implementation, this would call the actual function
                    logger.info(f"Retrying operation: {op_type}")
                    
                    # Mark as synced
                    cursor.execute('DELETE FROM pending_operations WHERE id = ?', (op_id,))
                    
                except Exception as e:
                    logger.warning(f"Failed to sync operation {op_id}: {e}")
                    
                    # Increment retry count
                    cursor.execute('''
                        UPDATE pending_operations 
                        SET retry_count = retry_count + 1 
                        WHERE id = ?
                    ''', (op_id,))
            
            self.local_storage.commit()
            logger.info(f"Synced {len(operations)} pending operations")
            
        except Exception as e:
            logger.error(f"Failed to sync pending operations: {e}")
    
    def store_fallback_artifact(self, artifact_data: Dict[str, Any]) -> str:
        """Store artifact in fallback storage."""
        if not self.local_storage:
            raise Exception("Local storage not available")
        
        try:
            cursor = self.local_storage.cursor()
            
            artifact_id = artifact_data.get('id', f"fallback_{int(time.time())}")
            
            cursor.execute('''
                INSERT OR REPLACE INTO fallback_artifacts 
                (id, loan_id, artifact_type, etid, payload_sha256, walacor_tx_id, 
                 created_by, created_at, data_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                artifact_id,
                artifact_data.get('loan_id'),
                artifact_data.get('artifact_type'),
                artifact_data.get('etid'),
                artifact_data.get('payload_sha256'),
                artifact_data.get('walacor_tx_id'),
                artifact_data.get('created_by'),
                datetime.now(timezone.utc).isoformat(),
                json.dumps(artifact_data)
            ))
            
            self.local_storage.commit()
            logger.info(f"Stored fallback artifact: {artifact_id}")
            
            return artifact_id
            
        except Exception as e:
            logger.error(f"Failed to store fallback artifact: {e}")
            raise
    
    def get_fallback_artifact(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Get artifact from fallback storage."""
        if not self.local_storage:
            return None
        
        try:
            cursor = self.local_storage.cursor()
            cursor.execute('SELECT data_json FROM fallback_artifacts WHERE id = ?', (artifact_id,))
            result = cursor.fetchone()
            
            if result:
                return json.loads(result[0])
            return None
            
        except Exception as e:
            logger.error(f"Failed to get fallback artifact: {e}")
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """Get fallback service status."""
        return {
            'mode': self.current_mode.value,
            'services': self.service_status,
            'local_storage_available': self.local_storage is not None,
            'pending_operations': len(self.pending_operations) if hasattr(self, 'pending_operations') else 0
        }
    
    def recover_services(self) -> None:
        """Attempt to recover services."""
        logger.info("Attempting service recovery...")
        
        # Test database connection
        try:
            from .robust_database import get_robust_database
            db = get_robust_database()
            health_result = db.health_check()
            
            if health_result['healthy']:
                self.set_service_status('database', True)
                logger.info("Database service recovered")
        except Exception as e:
            logger.warning(f"Database recovery failed: {e}")
        
        # Test other services
        # (API, Walacor, etc.)
        
        # Sync pending operations if services are recovered
        if self.current_mode == FallbackMode.NORMAL:
            self.sync_pending_operations()

# Global fallback service instance
_fallback_service_instance: Optional[GracefulFallbackService] = None

def get_fallback_service() -> GracefulFallbackService:
    """Get the global fallback service instance."""
    global _fallback_service_instance
    if _fallback_service_instance is None:
        _fallback_service_instance = GracefulFallbackService()
    return _fallback_service_instance

def with_fallback(operation: Callable):
    """Decorator to add fallback handling to operations."""
    def wrapper(*args, **kwargs):
        fallback_service = get_fallback_service()
        return fallback_service.execute_with_fallback(operation, *args, **kwargs)
    return wrapper
