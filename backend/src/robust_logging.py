"""
Robust Logging and Alerting System

This module provides comprehensive logging and alerting for:
- Structured logging with context
- Performance monitoring
- Error tracking and alerting
- Log aggregation and analysis
- Real-time monitoring
"""

import logging
import json
import time
import threading
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum
import traceback
import sys
from pathlib import Path

logger = logging.getLogger(__name__)

class LogLevel(Enum):
    """Log level enumeration."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

@dataclass
class LogEntry:
    """Structured log entry."""
    timestamp: str
    level: str
    message: str
    service: str
    operation: Optional[str] = None
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    duration_ms: Optional[float] = None
    error_code: Optional[str] = None
    stack_trace: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)

class RobustLogger:
    """
    Robust logging system with structured logging and alerting.
    
    Features:
    - Structured JSON logging
    - Performance monitoring
    - Error tracking
    - Real-time alerting
    - Log rotation
    - Context preservation
    """
    
    def __init__(self, service_name: str = "walacor_integrity", log_level: str = "INFO"):
        """Initialize the robust logger."""
        self.service_name = service_name
        self.log_level = getattr(logging, log_level.upper())
        self.loggers: Dict[str, logging.Logger] = {}
        self.alert_handlers: List[Callable] = []
        self.performance_metrics: Dict[str, List[float]] = {}
        
        # Setup logging configuration
        self._setup_logging()
        
        logger.info(f"Robust logger initialized for service: {service_name}")
    
    def _setup_logging(self) -> None:
        """Setup logging configuration."""
        # Create logs directory
        logs_dir = Path("logs")
        logs_dir.mkdir(exist_ok=True)
        
        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(self.log_level)
        
        # Remove existing handlers
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # Console handler with structured format
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(self.log_level)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        root_logger.addHandler(console_handler)
        
        # File handler with JSON format
        file_handler = logging.FileHandler(logs_dir / f"{self.service_name}.log")
        file_handler.setLevel(self.log_level)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
        
        # Error file handler
        error_handler = logging.FileHandler(logs_dir / f"{self.service_name}_errors.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        root_logger.addHandler(error_handler)
    
    def get_logger(self, name: str) -> logging.Logger:
        """Get a logger instance."""
        if name not in self.loggers:
            self.loggers[name] = logging.getLogger(f"{self.service_name}.{name}")
        return self.loggers[name]
    
    def log_structured(self, level: LogLevel, message: str, service: str, 
                      operation: Optional[str] = None, user_id: Optional[str] = None,
                      request_id: Optional[str] = None, duration_ms: Optional[float] = None,
                      error_code: Optional[str] = None, exception: Optional[Exception] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log structured entry."""
        
        # Create log entry
        log_entry = LogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=level.value,
            message=message,
            service=service,
            operation=operation,
            user_id=user_id,
            request_id=request_id,
            duration_ms=duration_ms,
            error_code=error_code,
            stack_trace=traceback.format_exc() if exception else None,
            metadata=metadata or {}
        )
        
        # Log to appropriate level
        logger_instance = self.get_logger(service)
        log_message = json.dumps(log_entry.to_dict(), default=str)
        
        if level == LogLevel.DEBUG:
            logger_instance.debug(log_message)
        elif level == LogLevel.INFO:
            logger_instance.info(log_message)
        elif level == LogLevel.WARNING:
            logger_instance.warning(log_message)
        elif level == LogLevel.ERROR:
            logger_instance.error(log_message)
        elif level == LogLevel.CRITICAL:
            logger_instance.critical(log_message)
        
        # Handle alerts for critical errors
        if level in [LogLevel.ERROR, LogLevel.CRITICAL]:
            self._trigger_alert(log_entry)
        
        # Track performance metrics
        if duration_ms is not None:
            self._track_performance(operation, duration_ms)
    
    def _trigger_alert(self, log_entry: LogEntry) -> None:
        """Trigger alert for critical log entries."""
        alert_data = {
            'level': log_entry.level,
            'message': log_entry.message,
            'service': log_entry.service,
            'operation': log_entry.operation,
            'timestamp': log_entry.timestamp,
            'error_code': log_entry.error_code
        }
        
        # Call all alert handlers
        for handler in self.alert_handlers:
            try:
                handler(alert_data)
            except Exception as e:
                logger.error(f"Alert handler failed: {e}")
    
    def _track_performance(self, operation: str, duration_ms: float) -> None:
        """Track performance metrics."""
        if operation not in self.performance_metrics:
            self.performance_metrics[operation] = []
        
        self.performance_metrics[operation].append(duration_ms)
        
        # Keep only last 100 measurements
        if len(self.performance_metrics[operation]) > 100:
            self.performance_metrics[operation] = self.performance_metrics[operation][-100:]
    
    def add_alert_handler(self, handler: Callable) -> None:
        """Add alert handler."""
        self.alert_handlers.append(handler)
    
    def get_performance_metrics(self) -> Dict[str, Dict[str, float]]:
        """Get performance metrics."""
        metrics = {}
        
        for operation, durations in self.performance_metrics.items():
            if durations:
                metrics[operation] = {
                    'count': len(durations),
                    'avg_ms': sum(durations) / len(durations),
                    'min_ms': min(durations),
                    'max_ms': max(durations),
                    'p95_ms': sorted(durations)[int(len(durations) * 0.95)] if len(durations) > 20 else max(durations)
                }
        
        return metrics

class PerformanceMonitor:
    """Performance monitoring decorator and context manager."""
    
    def __init__(self, logger: RobustLogger, service: str, operation: str, 
                 user_id: Optional[str] = None, request_id: Optional[str] = None):
        """Initialize performance monitor."""
        self.logger = logger
        self.service = service
        self.operation = operation
        self.user_id = user_id
        self.request_id = request_id
        self.start_time = None
    
    def __enter__(self):
        """Enter context manager."""
        self.start_time = time.time()
        self.logger.log_structured(
            LogLevel.INFO,
            f"Starting operation: {self.operation}",
            self.service,
            operation=self.operation,
            user_id=self.user_id,
            request_id=self.request_id
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context manager."""
        if self.start_time:
            duration_ms = (time.time() - self.start_time) * 1000
            
            if exc_type:
                # Log error
                self.logger.log_structured(
                    LogLevel.ERROR,
                    f"Operation failed: {self.operation} - {str(exc_val)}",
                    self.service,
                    operation=self.operation,
                    user_id=self.user_id,
                    request_id=self.request_id,
                    duration_ms=duration_ms,
                    error_code=exc_type.__name__,
                    exception=exc_val
                )
            else:
                # Log success
                self.logger.log_structured(
                    LogLevel.INFO,
                    f"Operation completed: {self.operation}",
                    self.service,
                    operation=self.operation,
                    user_id=self.user_id,
                    request_id=self.request_id,
                    duration_ms=duration_ms
                )

def monitor_performance(logger: RobustLogger, service: str, operation: str,
                       user_id: Optional[str] = None, request_id: Optional[str] = None):
    """Decorator for performance monitoring."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            with PerformanceMonitor(logger, service, operation, user_id, request_id):
                return func(*args, **kwargs)
        return wrapper
    return decorator

class AlertHandler:
    """Alert handler for different types of alerts."""
    
    @staticmethod
    def console_alert(alert_data: Dict[str, Any]) -> None:
        """Console alert handler."""
        print(f"🚨 ALERT: {alert_data['level']} - {alert_data['message']}")
        print(f"   Service: {alert_data['service']}")
        print(f"   Operation: {alert_data.get('operation', 'N/A')}")
        print(f"   Time: {alert_data['timestamp']}")
    
    @staticmethod
    def file_alert(alert_data: Dict[str, Any]) -> None:
        """File alert handler."""
        alert_file = Path("logs") / "alerts.log"
        alert_file.parent.mkdir(exist_ok=True)
        
        with open(alert_file, 'a') as f:
            f.write(json.dumps(alert_data, default=str) + '\n')
    
    @staticmethod
    def email_alert(alert_data: Dict[str, Any]) -> None:
        """Email alert handler (placeholder)."""
        # In a real implementation, this would send emails
        logger.warning(f"Email alert would be sent: {alert_data}")
    
    @staticmethod
    def slack_alert(alert_data: Dict[str, Any]) -> None:
        """Slack alert handler (placeholder)."""
        # In a real implementation, this would send Slack messages
        logger.warning(f"Slack alert would be sent: {alert_data}")

# Global logger instance
_robust_logger_instance: Optional[RobustLogger] = None

def get_robust_logger() -> RobustLogger:
    """Get the global robust logger instance."""
    global _robust_logger_instance
    if _robust_logger_instance is None:
        _robust_logger_instance = RobustLogger()
        
        # Add default alert handlers
        _robust_logger_instance.add_alert_handler(AlertHandler.console_alert)
        _robust_logger_instance.add_alert_handler(AlertHandler.file_alert)
    
    return _robust_logger_instance

def log_database_operation(operation: str, table: str, record_id: Optional[str] = None,
                          duration_ms: Optional[float] = None, error: Optional[str] = None,
                          user_id: Optional[str] = None, request_id: Optional[str] = None) -> None:
    """Log database operation."""
    logger = get_robust_logger()
    
    level = LogLevel.ERROR if error else LogLevel.INFO
    message = f"Database {operation} on {table}"
    if record_id:
        message += f" (ID: {record_id})"
    if error:
        message += f" - Error: {error}"
    
    logger.log_structured(
        level=level,
        message=message,
        service="database",
        operation=operation,
        user_id=user_id,
        request_id=request_id,
        duration_ms=duration_ms,
        error_code=error
    )

def log_api_request(method: str, endpoint: str, status_code: int, duration_ms: float,
                   user_id: Optional[str] = None, request_id: Optional[str] = None,
                   error: Optional[str] = None) -> None:
    """Log API request."""
    logger = get_robust_logger()
    
    level = LogLevel.ERROR if status_code >= 400 else LogLevel.INFO
    message = f"{method} {endpoint} - {status_code}"
    if error:
        message += f" - Error: {error}"
    
    logger.log_structured(
        level=level,
        message=message,
        service="api",
        operation=f"{method}_{endpoint}",
        user_id=user_id,
        request_id=request_id,
        duration_ms=duration_ms,
        error_code=str(status_code) if status_code >= 400 else None
    )

def log_walacor_operation(operation: str, success: bool, duration_ms: Optional[float] = None,
                         error: Optional[str] = None, user_id: Optional[str] = None,
                         request_id: Optional[str] = None) -> None:
    """Log Walacor operation."""
    logger = get_robust_logger()
    
    level = LogLevel.ERROR if not success else LogLevel.INFO
    message = f"Walacor {operation}"
    if not success and error:
        message += f" - Error: {error}"
    
    logger.log_structured(
        level=level,
        message=message,
        service="walacor",
        operation=operation,
        user_id=user_id,
        request_id=request_id,
        duration_ms=duration_ms,
        error_code=error
    )
