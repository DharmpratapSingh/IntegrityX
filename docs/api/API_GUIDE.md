# 📚 IntegrityX API Guide

**Version**: 1.0.0  
**Base URL**: `http://localhost:8000`  
**Authentication**: Clerk JWT (Bearer token)

---

## 🚀 Quick Start

### 1. Authentication

IntegrityX uses Clerk for authentication. Obtain a JWT token from the frontend:

```javascript
// Frontend (Next.js with Clerk)
import { useAuth } from '@clerk/nextjs';

const { getToken } = useAuth();
const token = await getToken();
```

### 2. Make API Calls

```bash
curl -X POST http://localhost:8000/ingest-json \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "loan_id": "LOAN-12345",
      "amount": 250000,
      "borrower_name": "John Doe"
    }
  }'
```

### 3. Verify Documents (No Auth Required)

```bash
curl http://localhost:8000/public/verify/ETID123456
```

---

## 📖 Table of Contents

1. [Authentication](#authentication)
2. [Document Operations](#document-operations)
3. [Verification](#verification)
4. [Attestations](#attestations)
5. [Provenance](#provenance)
6. [Analytics](#analytics)
7. [Advanced Features](#advanced-features)
8. [Error Handling](#error-handling)
9. [Rate Limits](#rate-limits)
10. [Code Examples](#code-examples)

---

## 🔐 Authentication

### Overview

IntegrityX uses **Clerk JWT tokens** for authentication. Most endpoints require a valid Bearer token.

### Headers Required

```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

### Public Endpoints (No Auth)

The following endpoints do **NOT** require authentication:

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /public/verify/{etid}` - Verify any document
- `GET /api/docs` - Interactive API documentation
- `GET /api/redoc` - Alternative API documentation
- `GET /api/openapi.json` - OpenAPI specification

### Protected Endpoints

All other endpoints require authentication:

- Document ingestion
- Attestations
- Provenance tracking
- Analytics
- Administrative operations

---

## 📄 Document Operations

### Upload Single Document

**Endpoint**: `POST /ingest-json`

Upload a single JSON document for integrity verification and blockchain sealing.

**Request**:

```json
{
  "document": {
    "loan_id": "LOAN-12345",
    "amount": 250000,
    "borrower_name": "John Doe",
    "interest_rate": 4.5,
    "term_months": 360
  },
  "metadata": {
    "source": "loan_system",
    "user_id": "user123"
  }
}
```

**Response**:

```json
{
  "etid": "ETID-20241028123456-ABC123",
  "walacor_txid": "walacor_tx_789xyz",
  "hash": "sha256:abc123...",
  "timestamp": "2024-10-28T12:34:56Z",
  "status": "sealed",
  "message": "Document sealed successfully"
}
```

### Upload Multiple Files (Packet)

**Endpoint**: `POST /ingest-packet`

Upload multiple files as a single packet with manifest verification.

**Request** (multipart/form-data):

```bash
curl -X POST http://localhost:8000/ingest-packet \
  -H "Authorization: Bearer TOKEN" \
  -F "files=@document1.pdf" \
  -F "files=@document2.json" \
  -F "manifest=@manifest.json"
```

**Manifest Format**:

```json
{
  "packet_id": "PKT-12345",
  "files": [
    {
      "filename": "document1.pdf",
      "expected_hash": "sha256:abc123..."
    },
    {
      "filename": "document2.json",
      "expected_hash": "sha256:def456..."
    }
  ]
}
```

### Get Document

**Endpoint**: `GET /document/{etid}`

Retrieve a document by its ETID.

**Response**:

```json
{
  "etid": "ETID-20241028123456-ABC123",
  "document": { /* original document */ },
  "metadata": {
    "created_at": "2024-10-28T12:34:56Z",
    "hash": "sha256:abc123...",
    "status": "sealed"
  }
}
```

### Delete Document

**Endpoint**: `DELETE /document/{etid}`

Delete a document (admin only).

**Response**:

```json
{
  "message": "Document deleted successfully",
  "etid": "ETID-20241028123456-ABC123"
}
```

---

## ✅ Verification

### Public Verification

**Endpoint**: `GET /public/verify/{etid}`

Verify any document using its ETID. **No authentication required.**

**Response**:

```json
{
  "etid": "ETID-20241028123456-ABC123",
  "verified": true,
  "hash": "sha256:abc123...",
  "blockchain_verified": true,
  "walacor_txid": "walacor_tx_789xyz",
  "sealed_at": "2024-10-28T12:34:56Z",
  "integrity_check": "PASS"
}
```

### Batch Verification

**Endpoint**: `POST /verify/batch`

Verify multiple documents at once.

**Request**:

```json
{
  "etids": [
    "ETID-001",
    "ETID-002",
    "ETID-003"
  ]
}
```

**Response**:

```json
{
  "results": [
    {
      "etid": "ETID-001",
      "verified": true,
      "status": "valid"
    },
    {
      "etid": "ETID-002",
      "verified": false,
      "status": "tampered"
    }
  ]
}
```

---

## 📝 Attestations

### Create Attestation

**Endpoint**: `POST /attestations`

Add a role-based attestation to a document.

**Request**:

```json
{
  "etid": "ETID-20241028123456-ABC123",
  "role": "underwriter",
  "status": "approved",
  "comments": "Loan application approved",
  "attested_by": "john.doe@company.com"
}
```

**Response**:

```json
{
  "attestation_id": "ATT-12345",
  "etid": "ETID-20241028123456-ABC123",
  "role": "underwriter",
  "status": "approved",
  "timestamp": "2024-10-28T12:34:56Z"
}
```

### Get Attestations

**Endpoint**: `GET /attestations/{etid}`

Get all attestations for a document.

**Response**:

```json
{
  "etid": "ETID-20241028123456-ABC123",
  "attestations": [
    {
      "role": "underwriter",
      "status": "approved",
      "attested_by": "john.doe@company.com",
      "timestamp": "2024-10-28T12:34:56Z"
    },
    {
      "role": "compliance_officer",
      "status": "verified",
      "attested_by": "jane.smith@company.com",
      "timestamp": "2024-10-28T13:00:00Z"
    }
  ]
}
```

---

## 🔍 Provenance

### Get Provenance Chain

**Endpoint**: `GET /provenance/{etid}`

Get complete chain of custody for a document.

**Response**:

```json
{
  "etid": "ETID-20241028123456-ABC123",
  "chain": [
    {
      "action": "created",
      "user": "john.doe@company.com",
      "timestamp": "2024-10-28T12:34:56Z",
      "location": "New York, NY"
    },
    {
      "action": "sealed",
      "blockchain_tx": "walacor_tx_789xyz",
      "timestamp": "2024-10-28T12:35:00Z"
    },
    {
      "action": "attested",
      "role": "underwriter",
      "user": "jane.smith@company.com",
      "timestamp": "2024-10-28T13:00:00Z"
    }
  ],
  "total_events": 3
}
```

---

## 📊 Analytics

### Document Statistics

**Endpoint**: `GET /analytics/stats`

Get document statistics and insights.

**Response**:

```json
{
  "total_documents": 1234,
  "sealed_today": 45,
  "verified_today": 123,
  "average_health_score": 95.5,
  "tamper_detection_rate": 0.02,
  "top_document_types": [
    {"type": "loan_application", "count": 456},
    {"type": "disclosure", "count": 234}
  ]
}
```

### Predictive Analytics

**Endpoint**: `POST /analytics/predictive`

Get AI-powered predictions for document trends.

**Request**:

```json
{
  "metric": "document_volume",
  "timeframe": "next_30_days"
}
```

**Response**:

```json
{
  "prediction": {
    "metric": "document_volume",
    "forecast": [
      {"date": "2024-11-01", "predicted_value": 150},
      {"date": "2024-11-02", "predicted_value": 155}
    ],
    "confidence": 0.92
  }
}
```

---

## 🚀 Advanced Features

### AI Anomaly Detection

**Endpoint**: `POST /ai/detect-anomalies`

Detect anomalies in document data using AI.

**Request**:

```json
{
  "etid": "ETID-20241028123456-ABC123"
}
```

**Response**:

```json
{
  "anomalies_detected": true,
  "anomalies": [
    {
      "field": "loan_amount",
      "severity": "high",
      "reason": "Amount 10x higher than typical",
      "confidence": 0.95
    }
  ],
  "risk_score": 78.5
}
```

### Document Intelligence

**Endpoint**: `POST /intelligence/analyze`

Extract entities and insights from documents using NLP.

**Response**:

```json
{
  "entities": [
    {"type": "PERSON", "value": "John Doe", "confidence": 0.98},
    {"type": "MONEY", "value": "$250,000", "confidence": 0.99}
  ],
  "sentiment": "positive",
  "key_phrases": ["loan application", "mortgage approval"]
}
```

### Voice Commands (Experimental)

**Endpoint**: `POST /voice/command`

Execute commands using natural language.

**Request**:

```json
{
  "command": "Show me all loans approved today"
}
```

---

## ❌ Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid document format",
    "details": {
      "field": "loan_amount",
      "reason": "must be a positive number"
    },
    "request_id": "req_123456",
    "timestamp": "2024-10-28T12:34:56Z"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing token |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BLOCKCHAIN_ERROR` | 500 | Walacor blockchain error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `ENCRYPTION_ERROR` | 500 | Encryption/decryption failed |

---

## 🚦 Rate Limits

### Current Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public endpoints | 100 req | 1 minute |
| Authenticated endpoints | 1000 req | 1 minute |
| File uploads | 50 req | 1 minute |
| Analytics | 100 req | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1698504896
```

**Note**: Rate limiting is coming soon in Phase 3.

---

## 💻 Code Examples

### Python Client

```python
import requests

class IntegrityXClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def upload_document(self, document):
        response = requests.post(
            f"{self.base_url}/ingest-json",
            json={"document": document},
            headers=self.headers
        )
        return response.json()
    
    def verify_document(self, etid):
        response = requests.get(
            f"{self.base_url}/public/verify/{etid}"
        )
        return response.json()

# Usage
client = IntegrityXClient("http://localhost:8000", "your_jwt_token")
result = client.upload_document({
    "loan_id": "LOAN-12345",
    "amount": 250000
})
print(f"Sealed with ETID: {result['etid']}")
```

### JavaScript/TypeScript Client

```typescript
class IntegrityXClient {
  constructor(private baseUrl: string, private token: string) {}

  async uploadDocument(document: any) {
    const response = await fetch(`${this.baseUrl}/ingest-json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ document })
    });
    return response.json();
  }

  async verifyDocument(etid: string) {
    const response = await fetch(`${this.baseUrl}/public/verify/${etid}`);
    return response.json();
  }
}

// Usage
const client = new IntegrityXClient('http://localhost:8000', 'your_jwt_token');
const result = await client.uploadDocument({
  loan_id: 'LOAN-12345',
  amount: 250000
});
console.log(`Sealed with ETID: ${result.etid}`);
```

### cURL Examples

```bash
# Upload document
curl -X POST http://localhost:8000/ingest-json \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"document": {"loan_id": "LOAN-12345", "amount": 250000}}'

# Verify document (no auth)
curl http://localhost:8000/public/verify/ETID-20241028123456-ABC123

# Get attestations
curl http://localhost:8000/attestations/ETID-20241028123456-ABC123 \
  -H "Authorization: Bearer TOKEN"

# Get analytics
curl http://localhost:8000/analytics/stats \
  -H "Authorization: Bearer TOKEN"
```

---

## 📚 Additional Resources

- **Interactive API Docs**: `http://localhost:8000/api/docs`
- **Alternative Docs**: `http://localhost:8000/api/redoc`
- **OpenAPI Spec**: `http://localhost:8000/api/openapi.json`
- **Postman Collection**: `docs/api/IntegrityX.postman_collection.json`
- **GitHub**: https://github.com/dharmpratapsingh/IntegrityX
- **Support**: support@walacor.com

---

## 🆘 Support

**Need Help?**

- **Email**: support@walacor.com
- **Docs**: See project README.md
- **Issues**: GitHub Issues
- **Emergency**: See JUDGES_REVIEW_GUIDE.md

---

**Last Updated**: October 28, 2024  
**API Version**: 1.0.0  
**Status**: Production Ready ✅














