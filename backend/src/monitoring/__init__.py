"""
Monitoring and metrics module for IntegrityX.

Provides Prometheus-based metrics collection, custom application metrics,
and integration with Grafana for visualization.
"""

from .metrics import (
    metrics_collector,
    track_request,
    track_document_operation,
    track_blockchain_operation,
    track_error,
    get_metrics_summary
)

try:
    from .prometheus_middleware import PrometheusMiddleware
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    PrometheusMiddleware = None

__all__ = [
    'metrics_collector',
    'track_request',
    'track_document_operation',
    'track_blockchain_operation',
    'track_error',
    'get_metrics_summary',
    'PrometheusMiddleware',
    'PROMETHEUS_AVAILABLE'
]














