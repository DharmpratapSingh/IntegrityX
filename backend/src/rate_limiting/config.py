"""
Rate limiting configuration for IntegrityX API.

Defines rate limits for different endpoint types and user tiers.
"""

from enum import Enum
from typing import Dict, Tuple
from dataclasses import dataclass


class RateLimitTier(str, Enum):
    """Rate limit tiers for different user types."""
    PUBLIC = "public"          # Unauthenticated users
    AUTHENTICATED = "authenticated"  # Authenticated users
    PREMIUM = "premium"        # Premium tier users
    ADMIN = "admin"            # Admin users


@dataclass
class RateLimitRule:
    """Rate limit rule definition."""
    requests: int  # Number of requests allowed
    window: int    # Time window in seconds
    
    def __str__(self):
        return f"{self.requests} requests per {self.window} seconds"


# Rate limit configurations by tier
RATE_LIMITS: Dict[RateLimitTier, RateLimitRule] = {
    RateLimitTier.PUBLIC: RateLimitRule(requests=100, window=60),        # 100/min
    RateLimitTier.AUTHENTICATED: RateLimitRule(requests=1000, window=60), # 1000/min
    RateLimitTier.PREMIUM: RateLimitRule(requests=5000, window=60),      # 5000/min
    RateLimitTier.ADMIN: RateLimitRule(requests=10000, window=60),       # 10000/min
}

# Endpoint-specific rate limits (overrides tier limits)
# Format: {endpoint_pattern: (requests, window_seconds)}
ENDPOINT_LIMITS: Dict[str, Tuple[int, int]] = {
    # Public endpoints (more restrictive)
    "/public/verify": (200, 60),      # 200/min for verification
    "/health": (500, 60),              # 500/min for health checks
    
    # File upload endpoints (more restrictive)
    "/ingest-json": (100, 60),        # 100/min for document uploads
    "/ingest-packet": (50, 60),       # 50/min for packet uploads
    
    # AI/Analytics endpoints (more restrictive)
    "/ai/detect-anomalies": (50, 60),     # 50/min for AI operations
    "/analytics/predictive": (100, 60),   # 100/min for analytics
    
    # Authentication endpoints
    "/auth/token": (10, 60),          # 10/min for token refresh
    
    # Admin endpoints
    "/admin/*": (500, 60),            # 500/min for admin operations
}

# Endpoints that bypass rate limiting (use with caution!)
RATE_LIMIT_EXEMPT_PATHS = [
    "/api/docs",
    "/api/redoc",
    "/api/openapi.json",
]

# Redis configuration
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_PASSWORD = None  # Set in .env if needed
REDIS_KEY_PREFIX = "integrityx:ratelimit:"

# Rate limit response configuration
RATE_LIMIT_HEADERS = True  # Include X-RateLimit-* headers in responses
RATE_LIMIT_ERROR_MESSAGE = "Rate limit exceeded. Please try again later."

# Configuration dictionary
rate_limit_config = {
    "enabled": True,
    "redis_host": REDIS_HOST,
    "redis_port": REDIS_PORT,
    "redis_db": REDIS_DB,
    "redis_password": REDIS_PASSWORD,
    "key_prefix": REDIS_KEY_PREFIX,
    "tiers": RATE_LIMITS,
    "endpoint_limits": ENDPOINT_LIMITS,
    "exempt_paths": RATE_LIMIT_EXEMPT_PATHS,
    "include_headers": RATE_LIMIT_HEADERS,
    "error_message": RATE_LIMIT_ERROR_MESSAGE,
}


def get_rate_limit_for_endpoint(endpoint: str, tier: RateLimitTier) -> RateLimitRule:
    """
    Get the rate limit rule for a specific endpoint and tier.
    
    Args:
        endpoint: API endpoint path
        tier: User tier
    
    Returns:
        RateLimitRule with requests and window
    """
    # Check for exact match
    if endpoint in ENDPOINT_LIMITS:
        requests, window = ENDPOINT_LIMITS[endpoint]
        return RateLimitRule(requests=requests, window=window)
    
    # Check for wildcard match
    for pattern, (requests, window) in ENDPOINT_LIMITS.items():
        if pattern.endswith("/*"):
            prefix = pattern[:-2]  # Remove /*
            if endpoint.startswith(prefix):
                return RateLimitRule(requests=requests, window=window)
    
    # Fall back to tier limit
    return RATE_LIMITS[tier]


def is_endpoint_exempt(endpoint: str) -> bool:
    """
    Check if an endpoint is exempt from rate limiting.
    
    Args:
        endpoint: API endpoint path
    
    Returns:
        True if endpoint is exempt, False otherwise
    """
    return endpoint in RATE_LIMIT_EXEMPT_PATHS

















