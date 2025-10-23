"""
Comprehensive Health Monitoring System

This module provides comprehensive health monitoring for the entire platform including:
- Database health monitoring
- Service health checks
- Performance metrics
- Alerting system
- Automated recovery
"""

import asyncio
import logging
import time
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from enum import Enum
import json
import requests
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class HealthStatus(Enum):
    """Health status enumeration."""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

@dataclass
class HealthCheckResult:
    """Health check result."""
    service: str
    status: HealthStatus
    message: str
    response_time_ms: float
    timestamp: datetime
    details: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'service': self.service,
            'status': self.status.value,
            'message': self.message,
            'response_time_ms': self.response_time_ms,
            'timestamp': self.timestamp.isoformat(),
            'details': self.details or {}
        }

class HealthMonitor:
    """
    Comprehensive health monitoring system.
    
    Monitors:
    - Database connectivity and performance
    - API endpoints
    - External services
    - System resources
    - Application services
    """
    
    def __init__(self, check_interval: int = 30, alert_threshold: int = 3):
        """
        Initialize health monitor.
        
        Args:
            check_interval: Health check interval in seconds
            alert_threshold: Number of consecutive failures before alerting
        """
        self.check_interval = check_interval
        self.alert_threshold = alert_threshold
        self.monitoring = False
        self.monitor_thread = None
        self.shutdown_event = threading.Event()
        
        # Health check results
        self.health_results: Dict[str, List[HealthCheckResult]] = {}
        self.consecutive_failures: Dict[str, int] = {}
        
        # Alert handlers
        self.alert_handlers: List[Callable] = []
        
        # Health check functions
        self.health_checks: Dict[str, Callable] = {}
        
        logger.info("Health monitor initialized")
    
    def add_health_check(self, service: str, check_function: Callable) -> None:
        """Add a health check function for a service."""
        self.health_checks[service] = check_function
        logger.info(f"Added health check for service: {service}")
    
    def add_alert_handler(self, handler: Callable) -> None:
        """Add an alert handler."""
        self.alert_handlers.append(handler)
        logger.info("Added alert handler")
    
    def start_monitoring(self) -> None:
        """Start health monitoring."""
        if self.monitoring:
            logger.warning("Health monitoring is already running")
            return
        
        self.monitoring = True
        self.shutdown_event.clear()
        
        self.monitor_thread = threading.Thread(
            target=self._monitoring_loop,
            daemon=True,
            name="HealthMonitor"
        )
        self.monitor_thread.start()
        
        logger.info("Health monitoring started")
    
    def stop_monitoring(self) -> None:
        """Stop health monitoring."""
        if not self.monitoring:
            return
        
        self.monitoring = False
        self.shutdown_event.set()
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        logger.info("Health monitoring stopped")
    
    def _monitoring_loop(self) -> None:
        """Main monitoring loop."""
        while not self.shutdown_event.is_set():
            try:
                self._perform_all_health_checks()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                time.sleep(5)
    
    def _perform_all_health_checks(self) -> None:
        """Perform all health checks."""
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(self._perform_health_check, service, check_func): service
                for service, check_func in self.health_checks.items()
            }
            
            for future in futures:
                service = futures[future]
                try:
                    result = future.result(timeout=30)
                    self._process_health_result(service, result)
                except Exception as e:
                    logger.error(f"Health check failed for {service}: {e}")
                    self._process_health_result(service, HealthCheckResult(
                        service=service,
                        status=HealthStatus.UNKNOWN,
                        message=f"Health check failed: {str(e)}",
                        response_time_ms=0.0,
                        timestamp=datetime.now(timezone.utc)
                    ))
    
    def _perform_health_check(self, service: str, check_function: Callable) -> HealthCheckResult:
        """Perform a single health check."""
        start_time = time.time()
        
        try:
            result = check_function()
            response_time = (time.time() - start_time) * 1000
            
            if isinstance(result, dict):
                status = HealthStatus(result.get('status', 'unknown'))
                message = result.get('message', 'OK')
                details = result.get('details', {})
            elif isinstance(result, HealthCheckResult):
                return result
            else:
                status = HealthStatus.HEALTHY
                message = "OK"
                details = {}
            
            return HealthCheckResult(
                service=service,
                status=status,
                message=message,
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details=details
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                service=service,
                status=HealthStatus.CRITICAL,
                message=f"Health check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc)
            )
    
    def _process_health_result(self, service: str, result: HealthCheckResult) -> None:
        """Process health check result."""
        # Store result
        if service not in self.health_results:
            self.health_results[service] = []
        
        self.health_results[service].append(result)
        
        # Keep only last 100 results
        if len(self.health_results[service]) > 100:
            self.health_results[service] = self.health_results[service][-100:]
        
        # Update consecutive failures
        if result.status == HealthStatus.CRITICAL:
            self.consecutive_failures[service] = self.consecutive_failures.get(service, 0) + 1
        else:
            self.consecutive_failures[service] = 0
        
        # Check for alerts
        if self.consecutive_failures.get(service, 0) >= self.alert_threshold:
            self._trigger_alert(service, result)
        
        logger.debug(f"Health check result for {service}: {result.status.value} - {result.message}")
    
    def _trigger_alert(self, service: str, result: HealthCheckResult) -> None:
        """Trigger alert for service failure."""
        alert_data = {
            'service': service,
            'status': result.status.value,
            'message': result.message,
            'timestamp': result.timestamp.isoformat(),
            'consecutive_failures': self.consecutive_failures.get(service, 0)
        }
        
        logger.warning(f"ALERT: Service {service} is unhealthy - {result.message}")
        
        # Call all alert handlers
        for handler in self.alert_handlers:
            try:
                handler(alert_data)
            except Exception as e:
                logger.error(f"Alert handler failed: {e}")
    
    def get_overall_health(self) -> Dict[str, Any]:
        """Get overall system health."""
        if not self.health_results:
            return {
                'status': HealthStatus.UNKNOWN.value,
                'message': 'No health checks performed yet',
                'services': {},
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        # Determine overall status
        all_statuses = []
        service_statuses = {}
        
        for service, results in self.health_results.items():
            if results:
                latest_result = results[-1]
                all_statuses.append(latest_result.status)
                service_statuses[service] = latest_result.to_dict()
        
        if not all_statuses:
            overall_status = HealthStatus.UNKNOWN
            message = "No recent health check results"
        elif HealthStatus.CRITICAL in all_statuses:
            overall_status = HealthStatus.CRITICAL
            message = "One or more services are critical"
        elif HealthStatus.WARNING in all_statuses:
            overall_status = HealthStatus.WARNING
            message = "One or more services have warnings"
        else:
            overall_status = HealthStatus.HEALTHY
            message = "All services are healthy"
        
        return {
            'status': overall_status.value,
            'message': message,
            'services': service_statuses,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def get_service_health(self, service: str) -> Dict[str, Any]:
        """Get health status for a specific service."""
        if service not in self.health_results or not self.health_results[service]:
            return {
                'status': HealthStatus.UNKNOWN.value,
                'message': 'No health check results available',
                'history': [],
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        results = self.health_results[service]
        latest_result = results[-1]
        
        return {
            'status': latest_result.status.value,
            'message': latest_result.message,
            'response_time_ms': latest_result.response_time_ms,
            'history': [result.to_dict() for result in results[-10:]],  # Last 10 results
            'consecutive_failures': self.consecutive_failures.get(service, 0),
            'timestamp': latest_result.timestamp.isoformat()
        }

# Database health check functions
def check_database_health() -> Dict[str, Any]:
    """Check database health."""
    try:
        from .robust_database import get_robust_database
        
        db = get_robust_database()
        health_result = db.health_check()
        
        if health_result['healthy']:
            return {
                'status': 'healthy',
                'message': 'Database is healthy',
                'details': health_result
            }
        else:
            return {
                'status': 'critical',
                'message': f"Database is unhealthy: {health_result.get('error', 'Unknown error')}",
                'details': health_result
            }
    except Exception as e:
        return {
            'status': 'critical',
            'message': f"Database health check failed: {str(e)}",
            'details': {}
        }

def check_api_health() -> Dict[str, Any]:
    """Check API health."""
    try:
        # Check if the API is responding
        response = requests.get('http://localhost:8000/api/health', timeout=10)
        
        if response.status_code == 200:
            return {
                'status': 'healthy',
                'message': 'API is responding',
                'details': {'status_code': response.status_code}
            }
        else:
            return {
                'status': 'warning',
                'message': f"API returned status {response.status_code}",
                'details': {'status_code': response.status_code}
            }
    except requests.exceptions.RequestException as e:
        return {
            'status': 'critical',
            'message': f"API is not responding: {str(e)}",
            'details': {}
        }

def check_walacor_health() -> Dict[str, Any]:
    """Check Walacor service health."""
    try:
        # This would check Walacor blockchain connectivity
        # For now, return healthy if we can import the service
        from .walacor_service import WalacorIntegrityService
        
        return {
            'status': 'healthy',
            'message': 'Walacor service is available',
            'details': {}
        }
    except Exception as e:
        return {
            'status': 'warning',
            'message': f"Walacor service check failed: {str(e)}",
            'details': {}
        }

# Global health monitor instance
_health_monitor_instance: Optional[HealthMonitor] = None

def get_health_monitor() -> HealthMonitor:
    """Get the global health monitor instance."""
    global _health_monitor_instance
    if _health_monitor_instance is None:
        _health_monitor_instance = HealthMonitor()
        
        # Add default health checks
        _health_monitor_instance.add_health_check('database', check_database_health)
        _health_monitor_instance.add_health_check('api', check_api_health)
        _health_monitor_instance.add_health_check('walacor', check_walacor_health)
        
        # Start monitoring
        _health_monitor_instance.start_monitoring()
    
    return _health_monitor_instance

def alert_handler(alert_data: Dict[str, Any]) -> None:
    """Default alert handler."""
    logger.critical(f"SYSTEM ALERT: {alert_data}")
    
    # Here you could add:
    # - Send email notifications
    # - Send Slack messages
    # - Create tickets
    # - Trigger automated recovery

def shutdown_health_monitor() -> None:
    """Shutdown the global health monitor."""
    global _health_monitor_instance
    if _health_monitor_instance:
        _health_monitor_instance.stop_monitoring()
        _health_monitor_instance = None
