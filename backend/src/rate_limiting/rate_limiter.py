"""
Redis-based rate limiter for IntegrityX API.

Implements token bucket algorithm with Redis for distributed rate limiting.
"""

import time
import logging
import threading
from typing import Optional, Tuple
import redis
from redis.exceptions import RedisError

from .config import (
    rate_limit_config,
    RateLimitTier,
    RateLimitRule,
    get_rate_limit_for_endpoint
)

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(self, limit: int, window: int, retry_after: int):
        self.limit = limit
        self.window = window
        self.retry_after = retry_after
        super().__init__(
            f"Rate limit of {limit} requests per {window} seconds exceeded. "
            f"Retry after {retry_after} seconds."
        )


class RateLimiter:
    """
    Redis-based rate limiter using token bucket algorithm.
    
    Features:
    - Per-user rate limiting
    - Per-endpoint rate limiting
    - Tiered rate limits
    - Graceful degradation if Redis unavailable
    - Standard rate limit headers
    """
    
    def __init__(
        self,
        redis_host: str = None,
        redis_port: int = None,
        redis_db: int = None,
        redis_password: str = None,
        key_prefix: str = None,
        enabled: bool = True
    ):
        """
        Initialize rate limiter.
        
        Args:
            redis_host: Redis server host
            redis_port: Redis server port
            redis_db: Redis database number
            redis_password: Redis password (optional)
            key_prefix: Prefix for Redis keys
            enabled: Enable/disable rate limiting
        """
        self.enabled = enabled
        self.key_prefix = key_prefix or rate_limit_config["key_prefix"]
        
        # Initialize Redis connection
        self.redis_client = None
        self.redis_available = False
        # In-memory fallback store: { key: [timestamps...] }
        self._local_lock = threading.Lock()
        self._local_buckets = {}
        
        if enabled:
            try:
                self.redis_client = redis.Redis(
                    host=redis_host or rate_limit_config["redis_host"],
                    port=redis_port or rate_limit_config["redis_port"],
                    db=redis_db or rate_limit_config["redis_db"],
                    password=redis_password or rate_limit_config["redis_password"],
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                
                # Test connection
                self.redis_client.ping()
                self.redis_available = True
                logger.info("✅ Rate limiter initialized with Redis")
                
            except RedisError as e:
                logger.warning(f"⚠️ Redis unavailable, switching to in-memory rate limiting fallback: {e}")
                self.redis_available = False
            except Exception as e:
                logger.error(f"❌ Failed to initialize rate limiter: {e}")
                self.redis_available = False
    
    def _get_redis_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limiting."""
        return f"{self.key_prefix}{identifier}:{endpoint}"
    
    def check_rate_limit(
        self,
        identifier: str,
        endpoint: str,
        tier: RateLimitTier = RateLimitTier.PUBLIC
    ) -> Tuple[bool, int, int, int]:
        """
        Check if request is within rate limit.
        
        Args:
            identifier: User identifier (user_id, IP address, etc.)
            endpoint: API endpoint being accessed
            tier: User tier for rate limiting
        
        Returns:
            Tuple of (allowed, remaining, limit, reset_time)
            - allowed: True if request is allowed
            - remaining: Number of requests remaining
            - limit: Total requests allowed in window
            - reset_time: Unix timestamp when limit resets
        
        Raises:
            RateLimitExceeded: If rate limit is exceeded
        """
        # If rate limiting is disabled, allow request
        if not self.enabled:
            return True, 9999, 10000, int(time.time()) + 60
        
        # Get rate limit rule for endpoint and tier
        rule = get_rate_limit_for_endpoint(endpoint, tier)
        
        key = self._get_redis_key(identifier, endpoint)
        current_time = int(time.time())
        window_start = current_time - rule.window
        
        # In-memory fallback when Redis is unavailable
        if not self.redis_available:
            with self._local_lock:
                bucket = self._local_buckets.get(key, [])
                # Drop timestamps outside the window
                bucket = [ts for ts in bucket if ts > window_start]
                if len(bucket) >= rule.requests:
                    retry_after = rule.window
                    logger.warning(
                        f"[fallback] Rate limit exceeded for {identifier} on {endpoint}: "
                        f"{len(bucket)}/{rule.requests}"
                    )
                    raise RateLimitExceeded(
                        limit=rule.requests,
                        window=rule.window,
                        retry_after=retry_after
                    )
                # Allow and record
                bucket.append(current_time)
                self._local_buckets[key] = bucket
                remaining = max(0, rule.requests - len(bucket))
                reset_time = current_time + rule.window
                return True, remaining, rule.requests, reset_time

        try:
            # Use Redis transaction for atomic operations
            pipe = self.redis_client.pipeline()
            
            # Remove old entries outside the window
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Count requests in current window
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiry on key
            pipe.expire(key, rule.window)
            
            # Execute transaction
            results = pipe.execute()
            
            # Get count after removing old entries
            count = results[1]
            
            # Calculate remaining requests and reset time
            remaining = max(0, rule.requests - count - 1)
            reset_time = current_time + rule.window
            
            # Check if limit exceeded
            if count >= rule.requests:
                retry_after = rule.window
                logger.warning(
                    f"Rate limit exceeded for {identifier} on {endpoint}: "
                    f"{count}/{rule.requests}"
                )
                raise RateLimitExceeded(
                    limit=rule.requests,
                    window=rule.window,
                    retry_after=retry_after
                )
            
            return True, remaining, rule.requests, reset_time
            
        except RateLimitExceeded:
            # Re-raise rate limit exceptions
            raise
        except RedisError as e:
            # If Redis fails, log and allow request (fail open)
            logger.error(f"Redis error in rate limiter: {e}")
            self.redis_available = False
            return True, 9999, 10000, int(time.time()) + 60
        except Exception as e:
            logger.error(f"Unexpected error in rate limiter: {e}")
            return True, 9999, 10000, int(time.time()) + 60
    
    def reset_limit(self, identifier: str, endpoint: str) -> bool:
        """
        Reset rate limit for a specific identifier and endpoint.
        
        Args:
            identifier: User identifier
            endpoint: API endpoint
        
        Returns:
            True if reset successful, False otherwise
        """
        if not self.redis_available:
            return False
        
        try:
            key = self._get_redis_key(identifier, endpoint)
            self.redis_client.delete(key)
            logger.info(f"Rate limit reset for {identifier} on {endpoint}")
            return True
        except RedisError as e:
            logger.error(f"Failed to reset rate limit: {e}")
            return False
    
    def get_current_usage(
        self,
        identifier: str,
        endpoint: str
    ) -> Tuple[int, int]:
        """
        Get current rate limit usage.
        
        Args:
            identifier: User identifier
            endpoint: API endpoint
        
        Returns:
            Tuple of (current_count, limit)
        """
        if not self.redis_available:
            # Estimate usage from local bucket
            with self._local_lock:
                rule = get_rate_limit_for_endpoint(endpoint, RateLimitTier.PUBLIC)
                key = self._get_redis_key(identifier, endpoint)
                bucket = self._local_buckets.get(key, [])
                return len(bucket), rule.requests
        
        try:
            key = self._get_redis_key(identifier, endpoint)
            count = self.redis_client.zcard(key)
            
            # Get limit for endpoint
            rule = get_rate_limit_for_endpoint(endpoint, RateLimitTier.PUBLIC)
            
            return count, rule.requests
        except Exception as e:
            logger.error(f"Failed to get current usage: {e}")
            return 0, 10000
    
    def cleanup_expired_keys(self) -> int:
        """
        Cleanup expired rate limit keys (maintenance task).
        
        Returns:
            Number of keys cleaned up
        """
        if not self.redis_available:
            # Cleanup local buckets
            with self._local_lock:
                now = int(time.time())
                removed = 0
                for key, bucket in list(self._local_buckets.items()):
                    new_bucket = [ts for ts in bucket if ts > now - 3600]
                    if not new_bucket:
                        del self._local_buckets[key]
                        removed += 1
                    else:
                        self._local_buckets[key] = new_bucket
                return removed
        
        try:
            # Redis automatically expires keys, so this is optional
            # Could scan for keys with no TTL and set expiry
            pattern = f"{self.key_prefix}*"
            cleaned = 0
            
            for key in self.redis_client.scan_iter(pattern):
                ttl = self.redis_client.ttl(key)
                if ttl == -1:  # No expiry set
                    self.redis_client.expire(key, 3600)  # Set 1 hour expiry
                    cleaned += 1
            
            logger.info(f"Cleaned up {cleaned} rate limit keys")
            return cleaned
            
        except Exception as e:
            logger.error(f"Failed to cleanup keys: {e}")
            return 0
    
    def health_check(self) -> bool:
        """
        Check if rate limiter is healthy.
        
        Returns:
            True if Redis is available, False otherwise
        """
        if not self.enabled:
            return True
        
        try:
            if self.redis_client:
                self.redis_client.ping()
                self.redis_available = True
                return True
        except Exception:
            self.redis_available = False
        
        return False


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get or create global rate limiter instance."""
    global _rate_limiter
    
    if _rate_limiter is None:
        _rate_limiter = RateLimiter(
            enabled=rate_limit_config["enabled"]
        )
    
    return _rate_limiter

