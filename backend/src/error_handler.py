"""
Enhanced Error Handling for Production Environments

This module provides comprehensive error handling with proper logging,
user-friendly error messages, and security-conscious error responses.
"""

import logging
import traceback
from typing import Dict, Any, Optional, Union
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time

logger = logging.getLogger(__name__)


class IntegrityXError(Exception):
    """Base exception for IntegrityX application errors."""
    
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code or "INTEGRITY_ERROR"
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(IntegrityXError):
    """Validation error for input data."""
    
    def __init__(self, message: str, field: str = None, value: Any = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={"field": field, "value": str(value) if value is not None else None}
        )


class SecurityError(IntegrityXError):
    """Security-related error."""
    
    def __init__(self, message: str, security_level: str = "medium"):
        super().__init__(
            message=message,
            error_code="SECURITY_ERROR",
            details={"security_level": security_level}
        )


class BlockchainError(IntegrityXError):
    """Blockchain operation error."""
    
    def __init__(self, message: str, operation: str = None, tx_id: str = None):
        super().__init__(
            message=message,
            error_code="BLOCKCHAIN_ERROR",
            details={"operation": operation, "tx_id": tx_id}
        )


class DatabaseError(IntegrityXError):
    """Database operation error."""
    
    def __init__(self, message: str, operation: str = None, table: str = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details={"operation": operation, "table": table}
        )


class ErrorHandler:
    """
    Comprehensive error handler for the IntegrityX application.
    
    Provides secure error handling with proper logging, user-friendly messages,
    and security-conscious error responses.
    """
    
    def __init__(self):
        self.error_codes = {
            "VALIDATION_ERROR": 400,
            "SECURITY_ERROR": 403,
            "BLOCKCHAIN_ERROR": 502,
            "DATABASE_ERROR": 500,
            "INTEGRITY_ERROR": 500,
            "UNKNOWN_ERROR": 500
        }
    
    def handle_validation_error(self, error: RequestValidationError) -> JSONResponse:
        """
        Handle FastAPI validation errors.
        
        Args:
            error: RequestValidationError from FastAPI
            
        Returns:
            JSONResponse with validation error details
        """
        error_details = []
        for err in error.errors():
            field = " -> ".join(str(loc) for loc in err["loc"])
            error_details.append({
                "field": field,
                "message": err["msg"],
                "type": err["type"]
            })
        
        logger.warning(f"Validation error: {error_details}")
        
        return JSONResponse(
            status_code=422,
            content={
                "ok": False,
                "error": {
                    "message": "Validation failed",
                    "code": "VALIDATION_ERROR",
                    "details": error_details
                }
            }
        )
    
    def handle_http_exception(self, error: Union[HTTPException, StarletteHTTPException]) -> JSONResponse:
        """
        Handle HTTP exceptions.
        
        Args:
            error: HTTPException or StarletteHTTPException
            
        Returns:
            JSONResponse with error details
        """
        logger.warning(f"HTTP error {error.status_code}: {error.detail}")
        
        return JSONResponse(
            status_code=error.status_code,
            content={
                "ok": False,
                "error": {
                    "message": str(error.detail),
                    "code": f"HTTP_{error.status_code}",
                    "status_code": error.status_code
                }
            }
        )
    
    def handle_integrity_error(self, error: IntegrityXError) -> JSONResponse:
        """
        Handle IntegrityX application errors.
        
        Args:
            error: IntegrityXError or subclass
            
        Returns:
            JSONResponse with error details
        """
        status_code = self.error_codes.get(error.error_code, 500)
        
        # Log error with appropriate level
        if status_code >= 500:
            logger.error(f"Application error: {error.message}", exc_info=True)
        else:
            logger.warning(f"Application error: {error.message}")
        
        return JSONResponse(
            status_code=status_code,
            content={
                "ok": False,
                "error": {
                    "message": error.message,
                    "code": error.error_code,
                    "details": error.details
                }
            }
        )
    
    def handle_unexpected_error(self, error: Exception, request: Request = None) -> JSONResponse:
        """
        Handle unexpected errors.
        
        Args:
            error: Unexpected exception
            request: FastAPI request object (optional)
            
        Returns:
            JSONResponse with generic error message
        """
        # Log full error details
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)
        
        # Get request details if available
        request_info = {}
        if request:
            request_info = {
                "method": request.method,
                "url": str(request.url),
                "headers": dict(request.headers)
            }
        
        # Return generic error message (don't expose internal details)
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "error": {
                    "message": "An unexpected error occurred. Please try again later.",
                    "code": "INTERNAL_ERROR",
                    "request_id": f"req_{int(time.time() * 1000)}"
                }
            }
        )
    
    def create_error_response(
        self, 
        message: str, 
        error_code: str = "UNKNOWN_ERROR",
        status_code: int = 500,
        details: Dict[str, Any] = None
    ) -> JSONResponse:
        """
        Create a standardized error response.
        
        Args:
            message: Error message
            error_code: Error code
            status_code: HTTP status code
            details: Additional error details
            
        Returns:
            JSONResponse with error details
        """
        return JSONResponse(
            status_code=status_code,
            content={
                "ok": False,
                "error": {
                    "message": message,
                    "code": error_code,
                    "details": details or {}
                }
            }
        )
    
    def log_error_with_context(
        self, 
        error: Exception, 
        context: Dict[str, Any] = None,
        level: str = "error"
    ) -> None:
        """
        Log error with additional context.
        
        Args:
            error: Exception to log
            context: Additional context information
            level: Log level (error, warning, info)
        """
        context_str = f" | Context: {context}" if context else ""
        
        if level == "error":
            logger.error(f"Error: {str(error)}{context_str}", exc_info=True)
        elif level == "warning":
            logger.warning(f"Warning: {str(error)}{context_str}")
        else:
            logger.info(f"Info: {str(error)}{context_str}")


# Global error handler instance
error_handler = ErrorHandler()


def setup_error_handlers(app):
    """
    Setup error handlers for the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return error_handler.handle_validation_error(exc)
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return error_handler.handle_http_exception(exc)
    
    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        return error_handler.handle_http_exception(exc)
    
    @app.exception_handler(IntegrityXError)
    async def integrity_error_handler(request: Request, exc: IntegrityXError):
        return error_handler.handle_integrity_error(exc)
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return error_handler.handle_unexpected_error(exc, request)


def safe_execute(func, *args, **kwargs):
    """
    Safely execute a function with comprehensive error handling.
    
    Args:
        func: Function to execute
        *args: Function arguments
        **kwargs: Function keyword arguments
        
    Returns:
        Tuple of (result, error) where result is the function return value or None,
        and error is the exception or None
    """
    try:
        result = func(*args, **kwargs)
        return result, None
    except IntegrityXError as e:
        error_handler.log_error_with_context(e, {"function": func.__name__}, "warning")
        return None, e
    except Exception as e:
        error_handler.log_error_with_context(e, {"function": func.__name__}, "error")
        return None, IntegrityXError(f"Unexpected error in {func.__name__}: {str(e)}")


async def safe_execute_async(func, *args, **kwargs):
    """
    Safely execute an async function with comprehensive error handling.
    
    Args:
        func: Async function to execute
        *args: Function arguments
        **kwargs: Function keyword arguments
        
    Returns:
        Tuple of (result, error) where result is the function return value or None,
        and error is the exception or None
    """
    try:
        result = await func(*args, **kwargs)
        return result, None
    except IntegrityXError as e:
        error_handler.log_error_with_context(e, {"function": func.__name__}, "warning")
        return None, e
    except Exception as e:
        error_handler.log_error_with_context(e, {"function": func.__name__}, "error")
        return None, IntegrityXError(f"Unexpected error in {func.__name__}: {str(e)}")
















