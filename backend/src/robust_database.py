"""
Robust Database Service with Connection Pool Management and Automatic Recovery

This module provides a production-ready database service with:
- Connection pooling with automatic recovery
- Health checks and monitoring
- Retry logic with exponential backoff
- Graceful degradation and fallback
- Comprehensive logging and alerting
"""

import os
import time
import logging
import threading
from typing import Optional, Dict, Any, List, Callable
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum
import json

from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, DisconnectionError, OperationalError
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy import event
# from sqlalchemy.engine.events import PoolEvents  # Not needed for this implementation
import psycopg2
from psycopg2 import OperationalError as Psycopg2OperationalError

from .models import Base

logger = logging.getLogger(__name__)

class ConnectionStatus(Enum):
    """Database connection status enumeration."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    RECOVERING = "recovering"

@dataclass
class ConnectionMetrics:
    """Database connection metrics."""
    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    overflow_connections: int = 0
    failed_connections: int = 0
    last_health_check: Optional[datetime] = None
    avg_response_time_ms: float = 0.0
    connection_errors: int = 0

class RobustDatabase:
    """
    Robust database service with automatic recovery and monitoring.
    
    Features:
    - Connection pooling with automatic recovery
    - Health checks and monitoring
    - Retry logic with exponential backoff
    - Graceful degradation
    - Comprehensive logging
    """
    
    def __init__(self, db_url: Optional[str] = None, max_retries: int = 5, 
                 retry_delay: float = 1.0, health_check_interval: int = 30):
        """
        Initialize the robust database service.
        
        Args:
            db_url: Database connection URL
            max_retries: Maximum number of retry attempts
            retry_delay: Initial retry delay in seconds
            health_check_interval: Health check interval in seconds
        """
        self.db_url = db_url or os.getenv('DATABASE_URL')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required. Please set it to your PostgreSQL connection string.")
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.health_check_interval = health_check_interval
        
        # Connection status and metrics
        self.status = ConnectionStatus.HEALTHY
        self.metrics = ConnectionMetrics()
        self.connection_lock = threading.Lock()
        self.health_check_thread = None
        self.shutdown_event = threading.Event()
        
        # Retry configuration
        self.retry_config = {
            'max_retries': max_retries,
            'base_delay': retry_delay,
            'max_delay': 60.0,
            'exponential_base': 2.0
        }
        
        # Initialize database connection
        self._initialize_connection()
        
        # Start health monitoring
        self._start_health_monitoring()
        
        logger.info(f"Robust database service initialized with URL: {self._mask_url(self.db_url)}")
    
    def _initialize_connection(self) -> None:
        """Initialize database connection with robust configuration."""
        try:
            # Determine pool class based on database type
            if self.db_url.startswith('postgresql'):
                pool_class = QueuePool
                pool_kwargs = {
                    'pool_size': 10,
                    'max_overflow': 20,
                    'pool_pre_ping': True,
                    'pool_recycle': 3600,
                    'pool_timeout': 30,
                    'pool_reset_on_return': 'commit'
                }
            else:
                pool_class = NullPool
                pool_kwargs = {}
            
            # Create engine with robust configuration
            self.engine = create_engine(
                self.db_url,
                poolclass=pool_class,
                echo=False,
                **pool_kwargs
            )
            
            # Add connection event listeners
            self._setup_connection_listeners()
            
            # Test connection
            self._test_connection()
            
            # Create all tables
            Base.metadata.create_all(self.engine)
            
            # Create session factory
            self.session_factory = sessionmaker(bind=self.engine)
            self.session: Optional[Session] = None
            
            self.status = ConnectionStatus.HEALTHY
            logger.info("Database connection initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database connection: {e}")
            self.status = ConnectionStatus.FAILED
            raise
    
    def _setup_connection_listeners(self) -> None:
        """Setup connection event listeners for monitoring."""
        
        @event.listens_for(self.engine, "connect")
        def on_connect(dbapi_connection, connection_record):
            """Handle new connection events."""
            with self.connection_lock:
                self.metrics.total_connections += 1
                logger.debug("New database connection established")
        
        @event.listens_for(self.engine, "close")
        def on_close(dbapi_connection, connection_record):
            """Handle connection close events."""
            with self.connection_lock:
                self.metrics.total_connections = max(0, self.metrics.total_connections - 1)
                logger.debug("Database connection closed")
        
        @event.listens_for(self.engine, "checkout")
        def on_checkout(dbapi_connection, connection_record, connection_proxy):
            """Handle connection checkout events."""
            with self.connection_lock:
                self.metrics.active_connections += 1
                logger.debug("Database connection checked out")
        
        @event.listens_for(self.engine, "checkin")
        def on_checkin(dbapi_connection, connection_record):
            """Handle connection checkin events."""
            with self.connection_lock:
                self.metrics.active_connections = max(0, self.metrics.active_connections - 1)
                logger.debug("Database connection checked in")
    
    def _test_connection(self) -> None:
        """Test database connection with retry logic."""
        for attempt in range(self.max_retries):
            try:
                with self.engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    result.fetchone()
                logger.info("Database connection test successful")
                return
            except Exception as e:
                logger.warning(f"Connection test attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self._calculate_retry_delay(attempt))
                else:
                    raise
    
    def _calculate_retry_delay(self, attempt: int) -> float:
        """Calculate retry delay with exponential backoff."""
        delay = self.retry_config['base_delay'] * (
            self.retry_config['exponential_base'] ** attempt
        )
        return min(delay, self.retry_config['max_delay'])
    
    def _start_health_monitoring(self) -> None:
        """Start health monitoring thread."""
        if self.health_check_thread is None or not self.health_check_thread.is_alive():
            self.health_check_thread = threading.Thread(
                target=self._health_monitor_loop,
                daemon=True,
                name="DatabaseHealthMonitor"
            )
            self.health_check_thread.start()
            logger.info("Database health monitoring started")
    
    def _health_monitor_loop(self) -> None:
        """Health monitoring loop."""
        while not self.shutdown_event.is_set():
            try:
                self._perform_health_check()
                time.sleep(self.health_check_interval)
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                time.sleep(5)  # Short delay before retry
    
    def _perform_health_check(self) -> None:
        """Perform comprehensive health check."""
        start_time = time.time()
        
        try:
            with self.engine.connect() as conn:
                # Test basic connectivity
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
                
                # Test connection pool status
                pool = self.engine.pool
                if hasattr(pool, 'size'):
                    self.metrics.total_connections = pool.size()
                if hasattr(pool, 'checkedin'):
                    self.metrics.idle_connections = pool.checkedin()
                if hasattr(pool, 'checkedout'):
                    self.metrics.active_connections = pool.checkedout()
                
                # Update metrics
                response_time = (time.time() - start_time) * 1000
                self.metrics.avg_response_time_ms = response_time
                self.metrics.last_health_check = datetime.now(timezone.utc)
                
                # Update status
                if response_time > 5000:  # 5 seconds
                    self.status = ConnectionStatus.DEGRADED
                    logger.warning(f"Database response time degraded: {response_time:.2f}ms")
                else:
                    self.status = ConnectionStatus.HEALTHY
                
                logger.debug(f"Health check passed - Response time: {response_time:.2f}ms")
                
        except Exception as e:
            self.metrics.connection_errors += 1
            self.status = ConnectionStatus.FAILED
            logger.error(f"Health check failed: {e}")
            
            # Attempt recovery
            self._attempt_recovery()
    
    def _attempt_recovery(self) -> None:
        """Attempt to recover from connection failure."""
        logger.info("Attempting database connection recovery...")
        self.status = ConnectionStatus.RECOVERING
        
        for attempt in range(self.max_retries):
            try:
                # Dispose of old connections
                self.engine.dispose()
                
                # Reinitialize connection
                self._initialize_connection()
                
                logger.info("Database connection recovery successful")
                self.status = ConnectionStatus.HEALTHY
                return
                
            except Exception as e:
                logger.warning(f"Recovery attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self._calculate_retry_delay(attempt))
        
        logger.error("Database connection recovery failed after all attempts")
        self.status = ConnectionStatus.FAILED
    
    @contextmanager
    def get_session(self):
        """Get database session with automatic recovery."""
        session = None
        try:
            session = self.session_factory()
            yield session
            session.commit()
        except Exception as e:
            if session:
                session.rollback()
            logger.error(f"Database session error: {e}")
            
            # Attempt recovery for connection errors
            if isinstance(e, (DisconnectionError, OperationalError, Psycopg2OperationalError)):
                self._attempt_recovery()
            
            raise
        finally:
            if session:
                session.close()
    
    def execute_with_retry(self, operation: Callable, *args, **kwargs):
        """Execute database operation with retry logic."""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return operation(*args, **kwargs)
            except (DisconnectionError, OperationalError, Psycopg2OperationalError) as e:
                last_exception = e
                logger.warning(f"Database operation failed (attempt {attempt + 1}): {e}")
                
                if attempt < self.max_retries - 1:
                    # Attempt recovery
                    self._attempt_recovery()
                    time.sleep(self._calculate_retry_delay(attempt))
                else:
                    logger.error("Database operation failed after all retry attempts")
                    raise
        
        if last_exception:
            raise last_exception
    
    def get_connection_metrics(self) -> Dict[str, Any]:
        """Get current connection metrics."""
        with self.connection_lock:
            return {
                'status': self.status.value,
                'total_connections': self.metrics.total_connections,
                'active_connections': self.metrics.active_connections,
                'idle_connections': self.metrics.idle_connections,
                'avg_response_time_ms': self.metrics.avg_response_time_ms,
                'connection_errors': self.metrics.connection_errors,
                'last_health_check': self.metrics.last_health_check.isoformat() if self.metrics.last_health_check else None
            }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check and return status."""
        start_time = time.time()
        
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'healthy': True,
                'status': self.status.value,
                'response_time_ms': response_time,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'metrics': self.get_connection_metrics()
            }
        except Exception as e:
            return {
                'healthy': False,
                'status': self.status.value,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'metrics': self.get_connection_metrics()
            }
    
    def _mask_url(self, url: str) -> str:
        """Mask sensitive information in database URL for logging."""
        if '@' in url:
            parts = url.split('@')
            if len(parts) == 2:
                user_part = parts[0]
                if ':' in user_part:
                    user_pass = user_part.split(':')
                    if len(user_pass) == 3:
                        masked = f"{user_pass[0]}://{user_pass[1]}:****@{parts[1]}"
                        return masked
        return url
    
    def shutdown(self) -> None:
        """Shutdown the database service gracefully."""
        logger.info("Shutting down robust database service...")
        
        # Stop health monitoring
        self.shutdown_event.set()
        if self.health_check_thread and self.health_check_thread.is_alive():
            self.health_check_thread.join(timeout=5)
        
        # Close all connections
        if hasattr(self, 'engine'):
            self.engine.dispose()
        
        logger.info("Robust database service shutdown complete")

# Global instance
_robust_db_instance: Optional[RobustDatabase] = None

def get_robust_database() -> RobustDatabase:
    """Get the global robust database instance."""
    global _robust_db_instance
    if _robust_db_instance is None:
        _robust_db_instance = RobustDatabase()
    return _robust_db_instance

def shutdown_robust_database() -> None:
    """Shutdown the global robust database instance."""
    global _robust_db_instance
    if _robust_db_instance:
        _robust_db_instance.shutdown()
        _robust_db_instance = None
