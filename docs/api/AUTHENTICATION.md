# 🔐 IntegrityX API Authentication Guide

**Authentication Method**: Clerk JWT (JSON Web Tokens)  
**Token Type**: Bearer Token  
**Last Updated**: October 28, 2024

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Getting a JWT Token](#getting-a-jwt-token)
3. [Using the Token](#using-the-token)
4. [Token Validation](#token-validation)
5. [Public vs Protected Endpoints](#public-vs-protected-endpoints)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

IntegrityX uses **Clerk** for authentication, providing secure, scalable user management with JWT-based API authentication.

### Key Points

- **Method**: Bearer Token Authentication
- **Token Format**: JWT (JSON Web Token)
- **Token Location**: `Authorization` header
- **Token Lifetime**: Configurable in Clerk dashboard
- **Refresh**: Automatic via Clerk SDK

---

## 🔑 Getting a JWT Token

### From the Frontend (Next.js with Clerk)

The frontend automatically handles authentication using Clerk's Next.js SDK:

```typescript
// app/components/ApiClient.tsx
import { useAuth } from '@clerk/nextjs';

export function useApiClient() {
  const { getToken } = useAuth();

  async function fetchWithAuth(endpoint: string, options = {}) {
    // Get the JWT token
    const token = await getToken();
    
    // Make authenticated request
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    return response.json();
  }

  return { fetchWithAuth };
}

// Usage in a component
function UploadDocument() {
  const { fetchWithAuth } = useApiClient();

  const uploadDocument = async (document: any) => {
    const result = await fetchWithAuth('/ingest-json', {
      method: 'POST',
      body: JSON.stringify({ document })
    });
    
    console.log('Uploaded:', result.etid);
  };

  return <button onClick={() => uploadDocument({...})}>Upload</button>;
}
```

### Manual Token Retrieval

For testing or external integrations:

1. **Sign in to the frontend** (http://localhost:3000)
2. **Open browser DevTools** → Console
3. **Get the token**:

```javascript
// In browser console
const token = await window.Clerk.session.getToken();
console.log(token);
```

4. **Copy the token** for use in Postman/cURL

---

## 📤 Using the Token

### HTTP Header Format

```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### cURL Example

```bash
curl -X POST http://localhost:8000/ingest-json \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"document": {"loan_id": "LOAN-12345"}}'
```

### Python Example

```python
import requests

def make_api_call(token, endpoint, data=None):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        f'http://localhost:8000{endpoint}',
        json=data,
        headers=headers
    )
    
    return response.json()

# Usage
token = "eyJhbGciOiJSUzI1NiIs..."
result = make_api_call(token, '/ingest-json', {
    'document': {'loan_id': 'LOAN-12345'}
})
```

### JavaScript/TypeScript Example

```typescript
async function makeApiCall(token: string, endpoint: string, data: any) {
  const response = await fetch(`http://localhost:8000${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
}

// Usage
const token = 'eyJhbGciOiJSUzI1NiIs...';
const result = await makeApiCall(token, '/ingest-json', {
  document: { loan_id: 'LOAN-12345' }
});
```

### Postman Setup

1. **Open Postman**
2. **Import collection**: `docs/api/IntegrityX.postman_collection.json`
3. **Set environment variable**:
   - Variable: `jwt_token`
   - Value: Your JWT token
4. **Collection-level auth** is already configured

---

## ✅ Token Validation

### Backend Validation Process

The backend validates tokens using Clerk's JWKS (JSON Web Key Set):

```python
# backend/src/auth.py
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify Clerk JWT token."""
    token = credentials.credentials
    
    try:
        # Decode and verify JWT
        payload = jwt.decode(
            token,
            clerk_public_key,  # From Clerk JWKS
            algorithms=['RS256'],
            audience=clerk_audience
        )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
```

### Token Claims

A valid Clerk JWT contains:

```json
{
  "iss": "https://clerk.your-domain.com",
  "sub": "user_2abcdefg123456",
  "exp": 1698504896,
  "iat": 1698501296,
  "azp": "your_clerk_frontend_api",
  "sid": "sess_2hijklmn789012"
}
```

---

## 🔓 Public vs Protected Endpoints

### Public Endpoints (No Auth Required)

These endpoints can be accessed without a token:

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /public/verify/{etid}` - Document verification
- `GET /api/docs` - API documentation
- `GET /api/redoc` - Alternative documentation
- `GET /api/openapi.json` - OpenAPI spec

### Protected Endpoints (Auth Required)

All other endpoints require authentication:

- `POST /ingest-json` - Upload documents
- `POST /ingest-packet` - Upload file packets
- `POST /attestations` - Create attestations
- `GET /provenance/{etid}` - Get provenance
- `GET /analytics/*` - All analytics endpoints
- `POST /ai/*` - AI-powered features
- `DELETE /document/{etid}` - Delete documents

---

## 🔧 Troubleshooting

### Error: 401 Unauthorized

**Cause**: Missing or invalid token

**Solutions**:
1. Ensure token is in `Authorization` header
2. Check token format: `Bearer <token>`
3. Verify token hasn't expired
4. Get a fresh token from Clerk

```bash
# Check if token is expired
# Decode JWT at https://jwt.io
```

### Error: 403 Forbidden

**Cause**: Valid token but insufficient permissions

**Solutions**:
1. Check user role in Clerk dashboard
2. Verify endpoint permissions
3. Ensure user is properly authenticated

### Token Expiration

**Symptoms**: Token works initially but fails later

**Solutions**:
1. **Frontend**: Clerk SDK auto-refreshes tokens
2. **External clients**: Implement token refresh logic
3. **Testing**: Get a new token from the frontend

### CORS Errors

**Symptoms**: Browser blocks requests

**Solutions**:
1. Ensure frontend URL is in CORS whitelist
2. Check backend CORS configuration in `main.py`
3. Use correct `Content-Type` header

### Token Not Found in Frontend

**Symptoms**: `getToken()` returns `null`

**Solutions**:
1. Ensure user is signed in
2. Check Clerk configuration
3. Verify Clerk API keys in `.env`

---

## 🛡️ Security Best Practices

### For Developers

1. **Never** commit JWT tokens to version control
2. **Never** log tokens in production
3. **Always** use HTTPS in production
4. **Rotate** API keys regularly
5. **Monitor** for suspicious activity

### For API Clients

1. **Store** tokens securely (not in localStorage for long-term)
2. **Use** environment variables for tokens
3. **Implement** token refresh logic
4. **Handle** 401 errors gracefully
5. **Don't** share tokens between environments

---

## 📚 Additional Resources

- **Clerk Documentation**: https://clerk.com/docs
- **JWT Debugger**: https://jwt.io
- **API Guide**: `docs/api/API_GUIDE.md`
- **Postman Collection**: `docs/api/IntegrityX.postman_collection.json`
- **Frontend Auth Hook**: `frontend/hooks/auth/useAuthenticatedToken.ts`

---

## 🆘 Support

**Authentication Issues?**

- **Email**: support@walacor.com
- **Check**: `JUDGES_REVIEW_GUIDE.md`
- **Logs**: `logs/walacor_integrity.log`

---

**Last Updated**: October 28, 2024  
**Authentication Provider**: Clerk  
**Status**: Production Ready ✅



