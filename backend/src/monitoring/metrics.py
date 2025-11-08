"""
Custom metrics collector for IntegrityX using Prometheus.

Tracks application-specific metrics:
- Document operations (upload, verify, seal)
- Blockchain interactions
- API performance
- Database operations
- Error rates
- Business metrics
"""

import time
import logging
from typing import Optional, Dict, Any
from prometheus_client import Counter, Histogram, Gauge, Summary, Info
from functools import wraps
from datetime import datetime

logger = logging.getLogger(__name__)

# =============================================================================
# HTTP Request Metrics
# =============================================================================

http_requests_total = Counter(
    'integrityx_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'integrityx_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=(0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0)
)

http_requests_in_progress = Gauge(
    'integrityx_http_requests_in_progress',
    'HTTP requests currently in progress',
    ['method', 'endpoint']
)

# =============================================================================
# Document Operation Metrics
# =============================================================================

documents_uploaded_total = Counter(
    'integrityx_documents_uploaded_total',
    'Total documents uploaded',
    ['document_type']
)

documents_verified_total = Counter(
    'integrityx_documents_verified_total',
    'Total documents verified',
    ['status']  # valid, invalid, tampered
)

documents_sealed_total = Counter(
    'integrityx_documents_sealed_total',
    'Total documents sealed to blockchain'
)

document_processing_duration_seconds = Histogram(
    'integrityx_document_processing_duration_seconds',
    'Document processing duration in seconds',
    ['operation'],  # upload, verify, seal
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0)
)

active_documents_gauge = Gauge(
    'integrityx_active_documents',
    'Current number of active documents in system'
)

# =============================================================================
# Blockchain Metrics
# =============================================================================

blockchain_operations_total = Counter(
    'integrityx_blockchain_operations_total',
    'Total blockchain operations',
    ['operation', 'status']  # seal, verify, query | success, failure
)

blockchain_operation_duration_seconds = Histogram(
    'integrityx_blockchain_operation_duration_seconds',
    'Blockchain operation duration in seconds',
    ['operation'],
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0)
)

walacor_api_calls_total = Counter(
    'integrityx_walacor_api_calls_total',
    'Total Walacor API calls',
    ['endpoint', 'status']
)

# =============================================================================
# Database Metrics
# =============================================================================

database_queries_total = Counter(
    'integrityx_database_queries_total',
    'Total database queries',
    ['operation', 'table']  # select, insert, update, delete
)

database_query_duration_seconds = Histogram(
    'integrityx_database_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0)
)

database_connections_active = Gauge(
    'integrityx_database_connections_active',
    'Active database connections'
)

# =============================================================================
# Error Metrics
# =============================================================================

errors_total = Counter(
    'integrityx_errors_total',
    'Total errors',
    ['error_type', 'endpoint']
)

validation_errors_total = Counter(
    'integrityx_validation_errors_total',
    'Total validation errors',
    ['field']
)

authentication_failures_total = Counter(
    'integrityx_authentication_failures_total',
    'Total authentication failures'
)

# =============================================================================
# Business Metrics
# =============================================================================

attestations_created_total = Counter(
    'integrityx_attestations_created_total',
    'Total attestations created',
    ['role', 'status']
)

provenance_queries_total = Counter(
    'integrityx_provenance_queries_total',
    'Total provenance chain queries'
)

ai_operations_total = Counter(
    'integrityx_ai_operations_total',
    'Total AI operations',
    ['operation']  # anomaly_detection, prediction, nlp
)

ai_operation_duration_seconds = Histogram(
    'integrityx_ai_operation_duration_seconds',
    'AI operation duration in seconds',
    ['operation'],
    buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0)
)

# =============================================================================
# System Metrics
# =============================================================================

application_info = Info(
    'integrityx_application',
    'Application information'
)

# Set application info
application_info.info({
    'version': '1.0.0',
    'environment': 'production',
    'name': 'IntegrityX'
})


# =============================================================================
# Metrics Collector Class
# =============================================================================

class MetricsCollector:
    """Central metrics collector for IntegrityX."""
    
    def __init__(self):
        self.enabled = True
        logger.info("✅ Metrics collector initialized")
    
    def track_http_request(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration: float
    ):
        """Track HTTP request metrics."""
        if not self.enabled:
            return
        
        try:
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status_code
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking HTTP request: {e}")
    
    def track_document_upload(self, document_type: str, duration: float):
        """Track document upload."""
        if not self.enabled:
            return
        
        try:
            documents_uploaded_total.labels(document_type=document_type).inc()
            document_processing_duration_seconds.labels(operation='upload').observe(duration)
        except Exception as e:
            logger.error(f"Error tracking document upload: {e}")
    
    def track_document_verification(self, status: str, duration: float):
        """Track document verification."""
        if not self.enabled:
            return
        
        try:
            documents_verified_total.labels(status=status).inc()
            document_processing_duration_seconds.labels(operation='verify').observe(duration)
        except Exception as e:
            logger.error(f"Error tracking document verification: {e}")
    
    def track_document_seal(self, duration: float):
        """Track document sealing to blockchain."""
        if not self.enabled:
            return
        
        try:
            documents_sealed_total.inc()
            document_processing_duration_seconds.labels(operation='seal').observe(duration)
        except Exception as e:
            logger.error(f"Error tracking document seal: {e}")
    
    def track_blockchain_operation(
        self,
        operation: str,
        status: str,
        duration: float
    ):
        """Track blockchain operation."""
        if not self.enabled:
            return
        
        try:
            blockchain_operations_total.labels(
                operation=operation,
                status=status
            ).inc()
            blockchain_operation_duration_seconds.labels(operation=operation).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking blockchain operation: {e}")
    
    def track_database_query(
        self,
        operation: str,
        table: str,
        duration: float
    ):
        """Track database query."""
        if not self.enabled:
            return
        
        try:
            database_queries_total.labels(
                operation=operation,
                table=table
            ).inc()
            database_query_duration_seconds.labels(operation=operation).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking database query: {e}")
    
    def track_error(self, error_type: str, endpoint: str):
        """Track error occurrence."""
        if not self.enabled:
            return
        
        try:
            errors_total.labels(
                error_type=error_type,
                endpoint=endpoint
            ).inc()
        except Exception as e:
            logger.error(f"Error tracking error: {e}")
    
    def track_ai_operation(self, operation: str, duration: float):
        """Track AI operation."""
        if not self.enabled:
            return
        
        try:
            ai_operations_total.labels(operation=operation).inc()
            ai_operation_duration_seconds.labels(operation=operation).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking AI operation: {e}")
    
    def update_active_documents(self, count: int):
        """Update active documents gauge."""
        if not self.enabled:
            return
        
        try:
            active_documents_gauge.set(count)
        except Exception as e:
            logger.error(f"Error updating active documents: {e}")
    
    def update_database_connections(self, count: int):
        """Update database connections gauge."""
        if not self.enabled:
            return
        
        try:
            database_connections_active.set(count)
        except Exception as e:
            logger.error(f"Error updating database connections: {e}")
    
    def get_summary(self) -> Dict[str, Any]:
        """Get metrics summary (for debugging)."""
        return {
            "enabled": self.enabled,
            "metrics_tracked": [
                "http_requests",
                "document_operations",
                "blockchain_operations",
                "database_queries",
                "errors",
                "ai_operations"
            ]
        }


# Global metrics collector instance
metrics_collector = MetricsCollector()


# =============================================================================
# Decorator Functions
# =============================================================================

def track_request(func):
    """Decorator to track HTTP requests."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            result = await func(*args, **kwargs)
            # Note: In real implementation, extract method, endpoint from request
            # metrics_collector.track_http_request(method, endpoint, 200, duration)
            
            return result
        except Exception as e:
            # Track failed request
            # metrics_collector.track_http_request(method, endpoint, 500, duration)
            logger.error(f"Request failed: {type(e).__name__}")
            raise
    
    return wrapper


def track_document_operation(operation: str):
    """Decorator to track document operations."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                if operation == 'upload':
                    metrics_collector.track_document_upload('generic', duration)
                elif operation == 'verify':
                    metrics_collector.track_document_verification('valid', duration)
                elif operation == 'seal':
                    metrics_collector.track_document_seal(duration)
                
                return result
            except Exception:
                logger.error(f"Document operation {operation} failed")
                raise
        
        return wrapper
    return decorator


def track_blockchain_operation(operation: str):
    """Decorator to track blockchain operations."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                metrics_collector.track_blockchain_operation(operation, 'success', duration)
                return result
            except Exception:
                duration = time.time() - start_time
                metrics_collector.track_blockchain_operation(operation, 'failure', duration)
                raise
        
        return wrapper
    return decorator


def track_error(error_type: str):
    """Decorator to track errors."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception:
                metrics_collector.track_error(error_type, func.__name__)
                raise
        
        return wrapper
    return decorator


def get_metrics_summary() -> Dict[str, Any]:
    """Get current metrics summary."""
    return metrics_collector.get_summary()

