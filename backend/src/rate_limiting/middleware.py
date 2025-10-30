"""
FastAPI middleware for rate limiting.

Integrates rate limiter with FastAPI, handling authentication,
headers, and error responses.
"""

import logging
from typing import Optional, Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time

from .rate_limiter import RateLimiter, RateLimitExceeded, get_rate_limiter
from .config import RateLimitTier, is_endpoint_exempt, rate_limit_config

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce rate limits on API requests.
    
    Features:
    - Extracts user identifier from JWT or IP address
    - Checks rate limits before processing request
    - Adds standard rate limit headers to response
    - Returns 429 Too Many Requests when limit exceeded
    - Graceful handling if Redis unavailable
    """
    
    def __init__(self, app: ASGIApp, rate_limiter: Optional[RateLimiter] = None):
        """
        Initialize rate limit middleware.
        
        Args:
            app: ASGI application
            rate_limiter: RateLimiter instance (optional, uses global if not provided)
        """
        super().__init__(app)
        self.rate_limiter = rate_limiter or get_rate_limiter()
        self.enabled = rate_limit_config["enabled"]
        self.include_headers = rate_limit_config["include_headers"]
    
    def _get_user_identifier(self, request: Request) -> str:
        """
        Extract user identifier from request.
        
        Priority:
        1. User ID from JWT token (if authenticated)
        2. Client IP address
        
        Args:
            request: FastAPI request object
        
        Returns:
            User identifier string
        """
        # Try to get user ID from JWT token in Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # In production, decode JWT and extract user_id
            # For now, use a hash of the token
            token = auth_header[7:]
            # Simplified: use first 16 chars of token as identifier
            if len(token) > 16:
                return f"user:{token[:16]}"
        
        # Fall back to IP address
        # Check for forwarded IP (if behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the list
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            # Get direct client IP
            client_ip = request.client.host if request.client else "unknown"
        
        return f"ip:{client_ip}"
    
    def _get_user_tier(self, request: Request) -> RateLimitTier:
        """
        Determine user tier based on authentication status.
        
        Args:
            request: FastAPI request object
        
        Returns:
            RateLimitTier enum value
        """
        # Check if user is authenticated
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header:
            return RateLimitTier.PUBLIC
        
        # In production, decode JWT and check user role/tier
        # For now, authenticated users get AUTHENTICATED tier
        return RateLimitTier.AUTHENTICATED
    
    def _add_rate_limit_headers(
        self,
        response: Response,
        limit: int,
        remaining: int,
        reset_time: int
    ) -> Response:
        """
        Add standard rate limit headers to response.
        
        Headers:
        - X-RateLimit-Limit: Total requests allowed
        - X-RateLimit-Remaining: Requests remaining
        - X-RateLimit-Reset: Unix timestamp when limit resets
        
        Args:
            response: FastAPI response object
            limit: Total requests allowed
            remaining: Requests remaining
            reset_time: Unix timestamp when limit resets
        
        Returns:
            Response with headers added
        """
        if self.include_headers:
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(reset_time)
        
        return response
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request through rate limiter.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
        
        Returns:
            Response with rate limit headers
        """
        # Skip rate limiting if disabled
        if not self.enabled:
            return await call_next(request)
        
        # Get endpoint path
        endpoint = request.url.path
        
        # Check if endpoint is exempt from rate limiting
        if is_endpoint_exempt(endpoint):
            return await call_next(request)
        
        # Get user identifier and tier
        identifier = self._get_user_identifier(request)
        tier = self._get_user_tier(request)
        
        try:
            # Check rate limit
            allowed, remaining, limit, reset_time = self.rate_limiter.check_rate_limit(
                identifier=identifier,
                endpoint=endpoint,
                tier=tier
            )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            response = self._add_rate_limit_headers(
                response, limit, remaining, reset_time
            )
            
            return response
            
        except RateLimitExceeded as e:
            # Rate limit exceeded - return 429 response
            retry_after = e.retry_after
            
            logger.warning(
                f"Rate limit exceeded for {identifier} on {endpoint}: "
                f"{e.limit} requests per {e.window}s"
            )
            
            # Create error response
            error_response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": rate_limit_config["error_message"],
                        "details": {
                            "limit": e.limit,
                            "window_seconds": e.window,
                            "retry_after_seconds": retry_after
                        },
                        "timestamp": time.time()
                    }
                }
            )
            
            # Add rate limit headers
            error_response.headers["X-RateLimit-Limit"] = str(e.limit)
            error_response.headers["X-RateLimit-Remaining"] = "0"
            error_response.headers["X-RateLimit-Reset"] = str(int(time.time()) + retry_after)
            error_response.headers["Retry-After"] = str(retry_after)
            
            return error_response
        
        except Exception as e:
            # Unexpected error - log and allow request (fail open)
            logger.error(f"Error in rate limit middleware: {e}")
            return await call_next(request)


def create_rate_limit_middleware() -> RateLimitMiddleware:
    """
    Factory function to create rate limit middleware.
    
    Returns:
        RateLimitMiddleware instance
    """
    rate_limiter = get_rate_limiter()
    return lambda app: RateLimitMiddleware(app, rate_limiter)



