# 🚦 IntegrityX Rate Limiting Guide

**Version**: 1.0.0  
**Implementation**: Redis-based Token Bucket  
**Last Updated**: October 28, 2024

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Rate Limit Tiers](#rate-limit-tiers)
3. [Endpoint-Specific Limits](#endpoint-specific-limits)
4. [Rate Limit Headers](#rate-limit-headers)
5. [Error Responses](#error-responses)
6. [Configuration](#configuration)
7. [Redis Setup](#redis-setup)
8. [Monitoring](#monitoring)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

IntegrityX implements **Redis-based rate limiting** to:

- **Prevent API abuse** and ensure fair resource usage
- **Protect backend infrastructure** from overload
- **Enforce tiered access** based on user authentication
- **Provide graceful degradation** if Redis is unavailable

### Key Features

✅ **Tier-based limits** - Different limits for public, authenticated, premium users  
✅ **Per-endpoint limits** - Custom limits for specific endpoints  
✅ **Standard headers** - X-RateLimit-* headers in responses  
✅ **Graceful handling** - 429 errors with retry-after  
✅ **Distributed** - Works across multiple backend instances  
✅ **Fast** - Redis provides microsecond latency  

---

## 🎭 Rate Limit Tiers

### Tier Overview

| Tier | Authentication | Limit | Window |
|------|----------------|-------|--------|
| **Public** | None | 100 requests | 1 minute |
| **Authenticated** | Clerk JWT | 1,000 requests | 1 minute |
| **Premium** | Paid plan | 5,000 requests | 1 minute |
| **Admin** | Admin role | 10,000 requests | 1 minute |

### How Tiers Are Determined

```python
# No Authorization header → PUBLIC tier
Request without auth → 100 requests/min

# Valid Authorization Bearer token → AUTHENTICATED tier
Authorization: Bearer eyJhbGci... → 1,000 requests/min

# Premium/Admin tiers (future implementation)
# Determined from JWT claims or database
```

---

## 🎯 Endpoint-Specific Limits

Some endpoints have custom limits that override tier limits:

### Public Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/public/verify` | 200/min | Allow more verifications |
| `/health` | 500/min | Health checks need higher limit |

### File Upload Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/ingest-json` | 100/min | Prevent upload spam |
| `/ingest-packet` | 50/min | Large file processing |

### AI/Analytics Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/ai/detect-anomalies` | 50/min | Expensive AI operations |
| `/analytics/predictive` | 100/min | Resource-intensive |

### Authentication Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/auth/token` | 10/min | Prevent brute force |

### Admin Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `/admin/*` | 500/min | Admin operations |

---

## 📊 Rate Limit Headers

Every response includes standard rate limit headers:

### Response Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1698504896
```

### Header Definitions

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Total requests allowed in window | `1000` |
| `X-RateLimit-Remaining` | Requests remaining in current window | `995` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1698504896` |

### When Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698504896
Retry-After: 45
```

---

## ❌ Error Responses

### 429 Too Many Requests

When rate limit is exceeded, you'll receive:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 1000,
      "window_seconds": 60,
      "retry_after_seconds": 45
    },
    "timestamp": 1698504851.234
  }
}
```

### Error Fields

| Field | Description |
|-------|-------------|
| `code` | Error code: `RATE_LIMIT_EXCEEDED` |
| `message` | Human-readable error message |
| `details.limit` | Number of requests allowed |
| `details.window_seconds` | Time window in seconds |
| `details.retry_after_seconds` | Seconds to wait before retry |
| `timestamp` | Unix timestamp of error |

### Handling in Client Code

```python
import time
import requests

def make_api_call_with_retry(url, headers):
    response = requests.get(url, headers=headers)
    
    if response.status_code == 429:
        # Rate limit exceeded
        error = response.json()['error']
        retry_after = error['details']['retry_after_seconds']
        
        print(f"Rate limit exceeded. Waiting {retry_after} seconds...")
        time.sleep(retry_after)
        
        # Retry request
        return make_api_call_with_retry(url, headers)
    
    return response
```

---

## ⚙️ Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=  # Optional

# Rate Limit Tiers (requests per minute)
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_AUTHENTICATED=1000
RATE_LIMIT_PREMIUM=5000
RATE_LIMIT_ADMIN=10000
```

### Configuration File

Edit `backend/src/rate_limiting/config.py`:

```python
# Rate limit configurations by tier
RATE_LIMITS: Dict[RateLimitTier, RateLimitRule] = {
    RateLimitTier.PUBLIC: RateLimitRule(requests=100, window=60),
    RateLimitTier.AUTHENTICATED: RateLimitRule(requests=1000, window=60),
    RateLimitTier.PREMIUM: RateLimitRule(requests=5000, window=60),
    RateLimitTier.ADMIN: RateLimitRule(requests=10000, window=60),
}

# Endpoint-specific limits
ENDPOINT_LIMITS: Dict[str, Tuple[int, int]] = {
    "/public/verify": (200, 60),
    "/ingest-json": (100, 60),
    # ... more endpoints
}
```

### Disabling Rate Limiting

For development/testing:

```python
# In config.py
rate_limit_config = {
    "enabled": False,  # Disable rate limiting
    # ... other config
}
```

Or via environment variable:

```bash
RATE_LIMIT_ENABLED=false
```

---

## 🔧 Redis Setup

### Local Development

#### Install Redis

```bash
# macOS
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server

# Windows
# Download from https://redis.io/download
```

#### Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Or run directly
redis-server
```

#### Test Connection

```bash
redis-cli ping
# Should return: PONG
```

### Production

#### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

#### Cloud Providers

- **AWS**: ElastiCache for Redis
- **Azure**: Azure Cache for Redis
- **GCP**: Cloud Memorystore for Redis
- **DigitalOcean**: Managed Redis

### Redis Configuration

```bash
# redis.conf

# Bind to all interfaces (production: specific IP)
bind 0.0.0.0

# Require password (production: enable)
# requirepass your_strong_password

# Max memory policy
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (optional for rate limiting)
save ""  # Disable RDB snapshots
appendonly no  # Disable AOF
```

---

## 📊 Monitoring

### Health Check

```python
from backend.src.rate_limiting import get_rate_limiter

rate_limiter = get_rate_limiter()
is_healthy = rate_limiter.health_check()

if is_healthy:
    print("✅ Rate limiter is healthy")
else:
    print("❌ Redis is unavailable")
```

### Current Usage

```python
identifier = "user:12345"
endpoint = "/ingest-json"

current, limit = rate_limiter.get_current_usage(identifier, endpoint)
print(f"Current usage: {current}/{limit}")
```

### Reset Limit (Admin)

```python
# Reset rate limit for a specific user/endpoint
rate_limiter.reset_limit("user:12345", "/ingest-json")
```

### Cleanup Expired Keys

```python
# Maintenance task (optional - Redis auto-expires)
cleaned = rate_limiter.cleanup_expired_keys()
print(f"Cleaned up {cleaned} expired keys")
```

---

## ✅ Best Practices

### For API Clients

1. **Respect rate limits** - Don't exceed limits
2. **Handle 429 errors** - Implement exponential backoff
3. **Monitor headers** - Track remaining requests
4. **Batch requests** - Combine multiple operations
5. **Cache responses** - Reduce API calls

### For Administrators

1. **Monitor Redis health** - Set up alerts
2. **Adjust limits** - Based on usage patterns
3. **Review logs** - Check for abuse patterns
4. **Set up backups** - Redis persistence (if needed)
5. **Scale Redis** - Add replicas for high traffic

### For Developers

1. **Test rate limiting** - Include in integration tests
2. **Document limits** - Update API docs
3. **Handle gracefully** - Fail open if Redis unavailable
4. **Log errors** - Track rate limit violations
5. **Optimize code** - Reduce unnecessary API calls

---

## 🔍 Troubleshooting

### Redis Connection Failed

**Symptom**: `Redis unavailable, rate limiting disabled`

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis  # Linux
```

### Rate Limits Not Working

**Symptom**: All requests allowed despite limits

**Check**:
1. Is rate limiting enabled in config?
   ```python
   rate_limit_config["enabled"]  # Should be True
   ```

2. Is Redis connected?
   ```python
   rate_limiter.health_check()  # Should return True
   ```

3. Check logs for errors:
   ```bash
   grep "rate limit" logs/walacor_integrity.log
   ```

### Too Many 429 Errors

**Symptom**: Legitimate users getting rate limited

**Solutions**:
1. Increase limits for authenticated users
2. Add IP whitelisting for trusted clients
3. Implement premium tier with higher limits
4. Review and adjust endpoint-specific limits

### Redis Memory Issues

**Symptom**: Redis running out of memory

**Solutions**:
```bash
# Check Redis memory usage
redis-cli INFO memory

# Set max memory
redis-cli CONFIG SET maxmemory 512mb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📚 Additional Resources

- **Configuration**: `backend/src/rate_limiting/config.py`
- **Rate Limiter**: `backend/src/rate_limiting/rate_limiter.py`
- **Middleware**: `backend/src/rate_limiting/middleware.py`
- **API Guide**: `docs/api/API_GUIDE.md`
- **Redis Documentation**: https://redis.io/documentation

---

## 🆘 Support

**Need Help?**

- **Email**: support@walacor.com
- **Docs**: See project README.md
- **Issues**: GitHub Issues

---

**Last Updated**: October 28, 2024  
**Implementation**: Redis-based Token Bucket  
**Status**: Production Ready ✅



