"""
Prometheus middleware for FastAPI.

Integrates Prometheus metrics collection with FastAPI, providing:
- Automatic HTTP request tracking
- Response time measurements
- Error rate monitoring
- Endpoint-specific metrics
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response as FastAPIResponse

from .metrics import (
    http_requests_total,
    http_request_duration_seconds,
    http_requests_in_progress,
    metrics_collector
)

logger = logging.getLogger(__name__)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    Middleware to collect Prometheus metrics for FastAPI requests.
    
    Automatically tracks:
    - Request count by method, endpoint, and status
    - Request duration
    - Requests in progress
    """
    
    def __init__(self, app: ASGIApp):
        """Initialize Prometheus middleware."""
        super().__init__(app)
        logger.info("✅ Prometheus middleware initialized")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and collect metrics."""
        # Skip metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)
        
        # Extract method and path
        method = request.method
        path = request.url.path
        
        # Normalize path (replace IDs with placeholders)
        normalized_path = self._normalize_path(path)
        
        # Track request in progress
        http_requests_in_progress.labels(
            method=method,
            endpoint=normalized_path
        ).inc()
        
        # Start timer
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Track metrics
            status_code = response.status_code
            
            http_requests_total.labels(
                method=method,
                endpoint=normalized_path,
                status=status_code
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=normalized_path
            ).observe(duration)
            
            # Use metrics collector for additional tracking
            metrics_collector.track_http_request(
                method=method,
                endpoint=normalized_path,
                status_code=status_code,
                duration=duration
            )
            
            return response
            
        except Exception as e:
            # Calculate duration even on error
            duration = time.time() - start_time
            
            # Track error
            http_requests_total.labels(
                method=method,
                endpoint=normalized_path,
                status=500
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=normalized_path
            ).observe(duration)
            
            metrics_collector.track_error(
                error_type=type(e).__name__,
                endpoint=normalized_path
            )
            
            logger.error(f"Request error: {e}")
            raise
            
        finally:
            # Decrement in-progress counter
            http_requests_in_progress.labels(
                method=method,
                endpoint=normalized_path
            ).dec()
    
    def _normalize_path(self, path: str) -> str:
        """
        Normalize path by replacing IDs with placeholders.
        
        Examples:
        - /document/ETID-123 -> /document/{etid}
        - /user/42 -> /user/{id}
        - /api/v1/items/abc123 -> /api/v1/items/{id}
        """
        parts = path.split('/')
        normalized_parts = []
        
        for i, part in enumerate(parts):
            if not part:
                continue
            
            if self._is_id_like(part):
                placeholder = self._get_placeholder(i, normalized_parts)
                normalized_parts.append(placeholder)
            else:
                normalized_parts.append(part)
        
        return '/' + '/'.join(normalized_parts) if normalized_parts else path
    
    def _get_placeholder(self, index: int, previous_parts: list) -> str:
        """Get appropriate placeholder based on context."""
        if index > 0 and previous_parts:
            prev = previous_parts[-1]
            if prev in ['document', 'documents']:
                return '{etid}'
            if prev in ['user', 'users']:
                return '{user_id}'
        return '{id}'
    
    def _is_id_like(self, part: str) -> bool:
        """Check if path part looks like an ID."""
        # Check for common ID patterns
        if part.startswith('ETID-'):
            return True
        if len(part) > 20 and all(c in '0123456789abcdefABCDEF-' for c in part):
            return True  # UUID-like
        if part.isdigit():
            return True  # Numeric ID
        return False


def create_metrics_endpoint():
    """
    Create FastAPI endpoint for Prometheus metrics.
    
    Usage:
        from src.monitoring.prometheus_middleware import create_metrics_endpoint
        
        @app.get("/metrics")
        async def metrics():
            return create_metrics_endpoint()
    """
    def metrics_endpoint():
        """Serve Prometheus metrics."""
        return FastAPIResponse(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    
    return metrics_endpoint


# Convenience function to add to FastAPI app
def setup_prometheus(app):
    """
    Setup Prometheus monitoring for FastAPI app.
    
    Args:
        app: FastAPI application instance
    
    Usage:
        from fastapi import FastAPI
        from src.monitoring.prometheus_middleware import setup_prometheus
        
        app = FastAPI()
        setup_prometheus(app)
    """
    # Add middleware
    app.add_middleware(PrometheusMiddleware)
    
    # Add metrics endpoint
    @app.get("/metrics")
    async def metrics():
        """Prometheus metrics endpoint."""
        return FastAPIResponse(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    
    logger.info("✅ Prometheus monitoring setup complete")
    logger.info("   Metrics available at: /metrics")

