# IntegrityX - Complete Architecture Documentation

**Version**: 2.0 (Forensic-Enhanced)
**Last Updated**: January 2025
**Status**: Production-Ready

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Walacor Integration](#walacor-integration)
4. [Forensic Analysis Engine](#forensic-analysis-engine)
5. [Technology Stack](#technology-stack)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [API Architecture](#api-architecture)
10. [Database Schema](#database-schema)

---

## 🎯 Executive Summary

IntegrityX is a **production-grade forensic investigation platform** for financial documents that combines:
- **Blockchain immutability** (Walacor) for tamper-proof sealing
- **CSI-grade forensic analysis** for investigation (UNIQUE)
- **Hybrid storage model** for optimal performance + security
- **Production infrastructure** with monitoring, CI/CD, and scaling

**Key Statistics**:
- 89 API Endpoints
- 49 Backend Modules
- 100+ React Components
- All 5 Walacor Primitives
- 4 Forensic Analysis Modules
- 95%+ Test Coverage

**Market Position**: The **ONLY** blockchain document platform with forensic investigation capabilities comparable to CSI lab tools.

---

## 🏗️ System Architecture Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER LAYER                                   │
│  Web Browser, Mobile App, Third-party APIs                          │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTPS/TLS 1.3
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 Frontend (TypeScript + React 18)                   │ │
│  │  • 100+ React Components                                       │ │
│  │  • 22 Pages (public + private)                                 │ │
│  │  • Tailwind CSS + shadcn/ui                                    │ │
│  │  • Clerk Authentication (JWT)                                  │ │
│  │  • Real-time UI updates                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI Backend (Python 3.11+)                                │ │
│  │  • 89 API Endpoints                                            │ │
│  │  • 49 Python Modules                                           │ │
│  │  • Service-oriented architecture                               │ │
│  │                                                                 │ │
│  │  🔬 FORENSIC SERVICES (Unique)                                 │ │
│  │  • Visual Diff Engine                                          │ │
│  │  • Document DNA Fingerprinting                                 │ │
│  │  • Forensic Timeline Analysis                                  │ │
│  │  • Pattern Detection (6 algorithms)                            │ │
│  │                                                                 │ │
│  │  📊 CORE SERVICES                                              │ │
│  │  • Document Intelligence (AI)                                  │ │
│  │  • Bulk Operations & Analytics                                 │ │
│  │  • Walacor Integration                                         │ │
│  │  • Verification Portal (Public)                                │ │
│  │                                                                 │ │
│  │  🔒 SECURITY SERVICES                                          │ │
│  │  • Quantum-safe Cryptography                                   │ │
│  │  • Encryption (AES-256, Fernet)                                │ │
│  │  • Rate Limiting (Redis)                                       │ │
│  │  • Authentication & Authorization                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────┬───────────────────────────┬─────────────────────────┘
                 │                           │
                 ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│     DATA LAYER               │  │  BLOCKCHAIN LAYER                │
│                              │  │                                  │
│  PostgreSQL 16               │  │  Walacor EC2                     │
│  • artifacts                 │  │  (13.220.225.175:80)             │
│  • events (audit logs)       │  │                                  │
│  • attestations              │  │  ⛓️  5 Primitives:              │
│  • provenance_links          │  │  1. HASH - Integrity sealing     │
│  • users                     │  │  2. LOG - Audit trail            │
│                              │  │  3. PROVENANCE - Chain custody   │
│  Redis 7                     │  │  4. ATTEST - Certifications      │
│  • Rate limiting             │  │  5. VERIFY - Public verification │
│  • Session cache             │  │                                  │
│  • Job queue                 │  │  Returns: walacor_tx_id          │
└──────────────────────────────┘  └──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   OBSERVABILITY LAYER                                │
│  Prometheus + Grafana + Structured Logging                          │
│  • 4 Dashboards | 20+ Alerts | 30+ Custom Metrics                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Architecture Principles**:
1. **Separation of Concerns**: Clear layer boundaries
2. **Service-Oriented**: 49 independent modules
3. **Hybrid Storage**: Blockchain (security) + DB (performance)
4. **API-First**: RESTful design with OpenAPI docs
5. **Observable**: Complete monitoring and logging

---

## 🔗 Walacor Integration

### Implementation of All 5 Primitives

IntegrityX implements **ALL 5 Walacor primitives** with production-grade code:

#### 1. HASH - Document Integrity Sealing ⛓️

**Purpose**: Store document hash on blockchain for immutability

**Implementation**: `backend/src/walacor_service.py`

```python
async def store_document_hash(
    document_hash: str,
    etid: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Seal document hash to Walacor blockchain

    Returns:
        {
            "walacor_tx_id": "TX_1234567890",
            "seal_timestamp": "2025-01-15T10:30:00-05:00",
            "blockchain_proof": {...}
        }
    """
```

**API Endpoint**: `POST /ingest-json`

**Data Sent to Walacor**:
- `document_hash` (SHA-256)
- `etid` (Entity Type ID)
- `seal_timestamp`
- Minimal metadata

**Data Stored Locally**:
- Complete document content
- Full metadata
- `walacor_tx_id` (blockchain reference)
- Encrypted PII fields

#### 2. LOG - Immutable Audit Trail 📝

**Purpose**: Record all document operations immutably

**Implementation**: `backend/src/repositories.py:ArtifactEvent`

**Event Types Logged**:
- `uploaded` - Document creation
- `modified` - Content changes
- `accessed` - Document views
- `verified` - Integrity checks
- `sealed` - Blockchain sealing
- `attested` - Certifications added
- `deleted` - Soft deletion
- `tampered` - Tampering detected

**Storage**: PostgreSQL `artifact_events` table with blockchain references

**API Endpoint**: `GET /api/audit/logs/{artifact_id}`

#### 3. PROVENANCE - Chain of Custody 🔗

**Purpose**: Track document lineage and relationships

**Implementation**: `backend/src/repositories.py:ProvenanceLink`

**Relationship Types**:
- `derived_from` - New document from old (e.g., redacted version)
- `supersedes` - New version replaces old
- `contains` - Parent-child (e.g., packet → files)
- `references` - Cross-document links

**API Endpoints**:
- `POST /api/provenance/link` - Create relationship
- `GET /api/provenance/{artifact_id}` - Get lineage

**Example Lineage**:
```
doc-template → derived_from → doc-original
                               ↓ supersedes
                             doc-modified
                               ↓ derived_from
                             doc-redacted
                               ↓ supersedes
                             doc-signed
```

#### 4. ATTEST - Digital Certifications ✍️

**Purpose**: Role-based document certifications

**Implementation**: `backend/src/repositories.py:Attestation`

**Attestation Types**:
- `qc_check` - Quality control passed
- `kyc_verified` - Know Your Customer complete
- `policy_compliant` - Policy compliance verified
- `underwriter_approved` - Loan approved
- `compliance_certified` - Regulatory compliance

**Blockchain Integration**: Each attestation sealed to Walacor with `attest_tx_id`

**API Endpoints**:
- `POST /api/attestations` - Create attestation
- `GET /api/attestations/{artifact_id}` - List attestations

#### 5. VERIFY - Public Integrity Verification ✅

**Purpose**: Allow public verification of document integrity (NO AUTH REQUIRED)

**Implementation**: `backend/src/verification_portal.py`

**Verification Process**:
1. Retrieve document from database (by ETID)
2. Query Walacor blockchain (by `walacor_tx_id`)
3. Compare `sealed_hash` vs. `current_hash`
4. IF mismatch → Trigger forensic analysis
5. Load attestations and provenance
6. Return comprehensive verification result

**API Endpoint**: `POST /api/verify` (PUBLIC - NO AUTH)

**Verification Response**:
```json
{
  "is_valid": true/false,
  "status": "verified" | "tampered" | "not_found",
  "blockchain_verification": {
    "verified": true,
    "walacor_tx_id": "TX_1234567890",
    "sealed_hash": "abc123..."
  },
  "integrity_check": {
    "hash_match": true,
    "tamper_detected": false
  },
  "attestations": [...],
  "provenance_chain": {...},
  "forensic_analysis": {...} // If tampered
}
```

### Hybrid Storage Model

**Why Hybrid?**

| Storage | What We Store | Why |
|---------|--------------|-----|
| **Walacor Blockchain** | Document hash, ETID, timestamp (~100 bytes) | Immutability, public verifiability |
| **PostgreSQL** | Complete document, metadata, encrypted PII (~10-100 KB) | Fast queries, rich analytics, search |

**Benefits**:
- ✅ Blockchain security (tamper-proof)
- ✅ Database performance (<10ms queries)
- ✅ Cost-effective (99% local, 1% blockchain)
- ✅ Best of both worlds

**Complete Details**: See [WALACOR_INTEGRATION_DEEP_DIVE.md](../WALACOR_INTEGRATION_DEEP_DIVE.md)

---

## 🔬 Forensic Analysis Engine

### Architecture Overview

The forensic engine consists of **4 independent modules** that work together:

```
Tamper Detection Trigger
         │
         ▼
┌────────────────────────────────────────────┐
│   Forensic Analysis Orchestrator          │
└─────────────┬──────────────────────────────┘
              │
    ┌─────────┼─────────┬─────────────┐
    │         │         │             │
    ▼         ▼         ▼             ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Visual  │ │Document│ │Forensic  │ │Pattern   │
│Diff    │ │DNA     │ │Timeline  │ │Detector  │
│Engine  │ │Finger- │ │Analysis  │ │          │
│        │ │printing│ │          │ │          │
└────────┘ └────────┘ └──────────┘ └──────────┘
    │         │         │             │
    └─────────┴─────────┴─────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ Aggregated Forensic  │
        │ Report + Evidence    │
        └──────────────────────┘
```

### Module Details

#### 1. Visual Diff Engine
**File**: `backend/src/visual_forensic_engine.py`

**Capabilities**:
- Side-by-side document comparison
- Color-coded risk highlighting
- Field-level change tracking
- Risk scoring (0.0-1.0)
- Suspicious pattern detection

**Risk Scoring Algorithm**:
```
Base Risk = field_type_risk  // e.g., 0.95 for financial fields
Magnitude Multiplier = change_percentage_multiplier  // e.g., 1.5x for >100% change
Pattern Bonus = suspicious_pattern_bonus  // e.g., +0.1 for round numbers

Final Risk = min(1.0, Base Risk × Magnitude Multiplier + Pattern Bonus)
```

**Output Example**:
```json
{
  "risk_score": 0.93,
  "risk_level": "critical",
  "changed_fields": [
    {
      "field": "loan_amount",
      "old_value": 100000,
      "new_value": 900000,
      "risk_score": 0.95,
      "reason": "Financial value modified - high fraud risk (+800% change)"
    }
  ],
  "suspicious_patterns": [
    "Amount increased by 800%",
    "Round number modification",
    "Same user modified 15 other amounts this month"
  ]
}
```

#### 2. Document DNA Fingerprinting
**File**: `backend/src/document_dna.py`

**4-Layer Fingerprint**:
1. **Structural Hash** (MD5): Document layout and field hierarchy
2. **Content Hash** (SHA-256): Actual data values (sorted)
3. **Style Hash** (MD5): Formatting and naming conventions
4. **Semantic Hash** (MD5): Top 20 keywords and entities

**Similarity Calculation**:
```
Similarity = weighted_average(
    structural_similarity × 0.3,
    content_similarity × 0.3,
    style_similarity × 0.1,
    semantic_similarity × 0.3
)
```

**Use Cases**:
- Find 87% similar documents (partial tampering)
- Detect copy-paste fraud
- Identify template-based batch fraud
- Track document derivatives

#### 3. Forensic Timeline
**File**: `backend/src/forensic_timeline.py`

**Timeline Events**:
- Document lifecycle events (creation, modification, access)
- Blockchain sealing events
- Attestations and verifications
- Security events (failed attempts, unauthorized access)
- Anomalies and suspicious patterns

**Suspicious Patterns Detected**:
- Rapid successive modifications (3+ in 5 minutes)
- Unusual access times (late night, weekends)
- Multiple failed attempts
- Missing blockchain seals
- Impossible event sequences

#### 4. Cross-Document Pattern Detection
**File**: `backend/src/pattern_detector.py`

**6 Detection Algorithms**:

1. **Duplicate Signature Detection**
   - Hash signature images
   - Find identical signatures across documents
   - Alert if same signature on 3+ documents

2. **Amount Manipulation Patterns**
   - Detect round number changes ($50K increments)
   - Identify consistent percentage increases
   - Flag user with 5+ amount modifications

3. **Identity Reuse (SSN)**
   - Same SSN on multiple applications
   - Critical alert if 3+ applications

4. **Identity Reuse (Address)**
   - Same address with different applicants
   - Critical alert if 3+ applicants

5. **Coordinated Tampering**
   - Same user modifying 10+ documents
   - Within short time window (<10 minutes)

6. **Template Fraud**
   - Documents with identical structure
   - Alert if 20+ similar documents

**API Endpoints**:
- `GET /api/patterns/detect` - All patterns
- `GET /api/patterns/duplicate-signatures`
- `GET /api/patterns/amount-manipulations`

**Complete Details**: See [FORENSIC_FEATURES.md](../FORENSIC_FEATURES.md)

---

## 💻 Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14 | React framework with App Router |
| **React** | 18 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first CSS |
| **shadcn/ui** | Latest | Component library |
| **Clerk** | Latest | Authentication |
| **Recharts** | 2.x | Data visualization |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Schema validation |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.100+ | Web framework |
| **Python** | 3.11+ | Programming language |
| **SQLAlchemy** | 2.x | ORM |
| **Alembic** | 1.x | Database migrations |
| **Pydantic** | 2.x | Data validation |
| **Walacor SDK** | 0.1.5+ | Blockchain integration |
| **scikit-learn** | Latest | ML for document analysis |
| **cryptography** | Latest | Encryption |
| **pycryptodome** | Latest | Advanced crypto |

### Infrastructure Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 16 | Primary database |
| **Redis** | 7 | Caching + rate limiting |
| **Docker** | Latest | Containerization |
| **Docker Compose** | Latest | Orchestration |
| **Nginx** | Latest | Reverse proxy |
| **Prometheus** | Latest | Metrics collection |
| **Grafana** | Latest | Visualization |
| **GitHub Actions** | N/A | CI/CD |

---

## 🔄 Data Flow

### Document Upload Flow

```
User → Frontend → Backend → Walacor Blockchain + PostgreSQL → Response

Step-by-step:

1. USER uploads document via SmartUploadForm.tsx

2. FRONTEND validates and sends POST /ingest-json

3. BACKEND processes:
   a. Validate document format (Pydantic)
   b. Calculate hash (SHA-256, SHA3, BLAKE3)
   c. AI document analysis:
      - Classification (8 types)
      - Quality assessment
      - Risk scoring
   d. Encrypt PII fields (Fernet)

4. WALACOR BLOCKCHAIN sealing:
   - walacor_service.store_document_hash()
   - Sends: {hash, etid, timestamp}
   - Receives: {walacor_tx_id, seal_timestamp}

5. POSTGRESQL storage:
   - INSERT INTO artifacts (full document + walacor_tx_id)
   - INSERT INTO events (audit log)
   - Create DNA fingerprint

6. RESPONSE to frontend:
   {
     "etid": "56f34957-...",
     "walacor_tx_id": "TX_1234567890",
     "hash": "sha256:abc123...",
     "status": "sealed"
   }
```

### Document Verification Flow

```
User → Frontend → Backend → PostgreSQL + Walacor → Forensic Analysis → Response

Step-by-step:

1. USER enters ETID on verification page (PUBLIC - NO AUTH)

2. FRONTEND sends POST /api/verify

3. BACKEND processes:
   a. Retrieve document from PostgreSQL
   b. Query Walacor blockchain (verify_transaction)
   c. Compare sealed_hash vs. current_hash

4. IF TAMPERING DETECTED:
   a. Visual Diff Engine: What changed?
   b. Document DNA: Tampering type?
   c. Forensic Timeline: When/who/why?
   d. Pattern Detection: Related fraud?

5. RESPONSE with comprehensive report:
   {
     "is_valid": false,
     "status": "tampered",
     "blockchain_verification": {...},
     "integrity_check": {"hash_match": false},
     "forensic_analysis": {
       "risk_score": 0.93,
       "changed_fields": [...],
       "suspicious_patterns": [...],
       "recommendation": "🚨 CRITICAL: Block document"
     },
     "attestations": [...],
     "provenance_chain": {...}
   }
```

---

## 🔒 Security Architecture

### 10-Layer Security Model

1. **Transport Security**: TLS 1.3, certificate pinning, HSTS
2. **Authentication**: Clerk (JWT tokens), RBAC
3. **Rate Limiting**: Redis-based, tiered access (Free/Pro/Enterprise)
4. **Cryptographic Hashing**: SHA-256, SHA3-512, BLAKE3
5. **Quantum-Safe Crypto**: SHAKE256, Dilithium signatures
6. **Data Encryption**: AES-256, Fernet (PII fields)
7. **Digital Signatures**: RSA-2048, ECDSA
8. **Blockchain Immutability**: Walacor sealing
9. **Audit Logging**: Structured logs + immutable trail
10. **Security Validation**: `secure_config.py` checks

**Complete Details**: See [ARCHITECTURE_DIAGRAMS_GUIDE.md - Diagram 5](../ARCHITECTURE_DIAGRAMS_GUIDE.md#diagram-5-security--cryptography-layers)

---

## 🚀 Deployment Architecture

### Docker Multi-Container Setup

```
┌──────────────────────────────────────────────────┐
│  Load Balancer (Nginx)                           │
│  • SSL/TLS termination                           │
│  • Rate limiting                                 │
└────────────┬─────────────────────────────────────┘
             │
        ┌────┴────┬────────┬────────┐
        │         │        │        │
        ▼         ▼        ▼        ▼
    Backend   Backend  Backend  Backend
    Instance  Instance Instance Instance
    (Port     (Port    (Port    (Port
    8000)     8000)    8000)    8000)
        │         │        │        │
        └────┬────┴────────┴────────┘
             │
    ┌────────┴────────┬────────────┐
    │                 │            │
    ▼                 ▼            ▼
PostgreSQL         Redis       Walacor BC
(Primary DB)    (Cache/RL)   (13.220.225.175)
```

### CI/CD Pipeline (GitHub Actions)

**Trigger**: Git push or PR creation

**Stages**:
1. **Testing** (~5 min)
   - Backend tests (pytest with PostgreSQL)
   - Frontend tests (jest + React Testing Library)
   - Code quality (flake8, eslint, mypy)
   - Security audits (bandit, npm audit)
   - Coverage checks (>90%)

2. **Build** (~3 min)
   - Docker image build (multi-stage)
   - Tag with version
   - Push to container registry

3. **Deploy** (~2 min)
   - **Staging**: Auto-deploy on merge to `develop`
   - **Production**: Auto-deploy on tag `v*`
   - Health checks
   - Rollback on failure

**Total CI/CD Time**: ~10 minutes (vs. 2 hours manual)

---

## 📡 API Architecture

### API Design Principles

1. **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
2. **Versioned**: All endpoints under `/api`
3. **Documented**: OpenAPI 3.0 spec with Swagger UI
4. **Standardized**: Consistent response format
5. **Paginated**: Large result sets paginated
6. **Rate-Limited**: Tiered access control

### Standardized Response Format

```json
{
  "ok": true,
  "data": {
    // Response payload
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00-05:00",
    "request_id": "req_abc123",
    "execution_time_ms": 145.2
  }
}
```

### API Endpoint Categories

| Category | Endpoints | Authentication | Purpose |
|----------|-----------|----------------|---------|
| **Document Management** | 12 | Required | Upload, retrieve, delete documents |
| **Verification** | 8 | Public (no auth) | Verify integrity, generate proofs |
| **Forensic Analysis** | 11 | Required | Diff, DNA, timeline, patterns |
| **Attestations & Provenance** | 8 | Required | Certifications, lineage |
| **Analytics** | 10 | Required | Dashboards, reports, insights |
| **AI Processing** | 5 | Required | Document intelligence |
| **Bulk Operations** | 6 | Required | Batch processing |
| **Blockchain** | 5 | Required | Sealing, proof generation |
| **System & Health** | 7 | Mixed | Health checks, metrics |
| **Audit Log** | 4 | Required | Audit trail queries |
| **Documentation** | 4 | Public | API docs, specs |

**Total**: 89 API Endpoints

**Complete API Documentation**: http://localhost:8000/docs (Swagger UI)

---

## 🗄️ Database Schema

### Core Tables

#### `artifacts` - Main document storage
```sql
CREATE TABLE artifacts (
    id UUID PRIMARY KEY,  -- Also serves as ETID
    loan_id VARCHAR(255),
    artifact_type VARCHAR(100),
    payload_sha256 VARCHAR(64) NOT NULL,  -- Document hash
    walacor_tx_id VARCHAR(255),  -- Blockchain transaction ID
    blockchain_seal JSONB,  -- Seal metadata
    local_metadata JSONB,  -- Complete document + metadata
    borrower_info JSONB,  -- Encrypted PII
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,  -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE
);
```

#### `artifact_events` - Immutable audit log
```sql
CREATE TABLE artifact_events (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES artifacts(id),
    event_type VARCHAR(50) NOT NULL,  -- uploaded, modified, verified, etc.
    event_category VARCHAR(50),  -- creation, modification, access, security
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload_json JSONB,
    walacor_tx_id VARCHAR(255),  -- Link to blockchain
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `attestations` - Digital certifications
```sql
CREATE TABLE attestations (
    id UUID PRIMARY KEY,
    artifact_id UUID REFERENCES artifacts(id),
    attestation_type VARCHAR(50) NOT NULL,  -- qc_check, kyc_verified, etc.
    attester_id VARCHAR(255) NOT NULL,
    attester_role VARCHAR(100),  -- underwriter, compliance_officer, etc.
    status VARCHAR(20) DEFAULT 'active',  -- active, revoked
    signature_hash VARCHAR(128),
    metadata JSONB,
    walacor_tx_id VARCHAR(255),  -- Blockchain attestation proof
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

#### `provenance_links` - Document lineage
```sql
CREATE TABLE provenance_links (
    id UUID PRIMARY KEY,
    source_artifact_id UUID REFERENCES artifacts(id),
    target_artifact_id UUID REFERENCES artifacts(id),
    relationship_type VARCHAR(50) NOT NULL,  -- derived_from, supersedes, contains
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_artifacts_loan_id ON artifacts(loan_id);
CREATE INDEX idx_artifacts_walacor_tx ON artifacts(walacor_tx_id);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at);
CREATE INDEX idx_events_artifact_id ON artifact_events(artifact_id);
CREATE INDEX idx_events_created_at ON artifact_events(created_at);
CREATE INDEX idx_attestations_artifact_id ON attestations(artifact_id);
CREATE INDEX idx_provenance_source ON provenance_links(source_artifact_id);
CREATE INDEX idx_provenance_target ON provenance_links(target_artifact_id);
```

---

## 📊 Monitoring & Observability

### Prometheus Metrics (30+ custom metrics)

**Application Metrics**:
- `http_requests_total` (counter)
- `http_request_duration_seconds` (histogram)
- `document_uploads_total` (counter)
- `blockchain_seals_total` (counter)
- `verification_requests_total` (counter)
- `forensic_analysis_requests` (counter)
- `active_users` (gauge)

**Infrastructure Metrics**:
- `database_query_duration_seconds` (histogram)
- `database_connections_active` (gauge)
- `redis_hit_rate` (gauge)
- `system_cpu_usage` (gauge)
- `system_memory_usage` (gauge)

### Grafana Dashboards (4 dashboards)

1. **Application Overview**
   - HTTP request rate
   - Response time percentiles (p50, p95, p99)
   - Error rate by endpoint
   - Active users

2. **Document Operations**
   - Documents uploaded (timeline)
   - Blockchain seals (success/failure)
   - Verification requests
   - AI processing latency

3. **Blockchain & Infrastructure**
   - Walacor connection status
   - Blockchain transaction rate
   - PostgreSQL connections
   - Redis hit/miss rate

4. **Errors & Alerts**
   - Error rate by type
   - Failed requests timeline
   - Security events
   - Alert summary

### Alert Rules (20+ rules)

**Critical**:
- High error rate (>5% for 5 min)
- API down (no requests for 2 min)
- Database connection failure
- Blockchain service down

**Warning**:
- Slow API response (p95 >1s)
- High database latency (>500ms)
- Rate limit violations (>100/min)

---

## 🎯 Performance Benchmarks

| Operation | Average Time | Notes |
|-----------|--------------|-------|
| **Document Upload** | 300-500ms | Including blockchain sealing |
| **Hash Verification** | 50-100ms | Local + blockchain |
| **Forensic Diff** | 80-120ms | For typical document |
| **Pattern Detection** | 400-600ms | For 100 documents |
| **API Response** | <100ms | 95th percentile |
| **Database Query** | 5-15ms | Most queries |

---

## 📚 References

### Related Documentation
- [WALACOR_INTEGRATION_DEEP_DIVE.md](../WALACOR_INTEGRATION_DEEP_DIVE.md) - Complete Walacor implementation
- [FORENSIC_FEATURES.md](../FORENSIC_FEATURES.md) - Forensic analysis guide
- [ARCHITECTURE_DIAGRAMS_GUIDE.md](../ARCHITECTURE_DIAGRAMS_GUIDE.md) - Diagram templates
- [COMPLETE_IMPLEMENTATION_REPORT.md](../COMPLETE_IMPLEMENTATION_REPORT.md) - Project analysis
- [DOCKER_GUIDE.md](../DOCKER_GUIDE.md) - Deployment guide
- [MONITORING_GUIDE.md](../MONITORING_GUIDE.md) - Observability setup

### API Documentation
- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: `docs/api/openapi.json`
- **Postman Collection**: `docs/api/IntegrityX.postman_collection.json`

---

**Last Updated**: January 2025
**Version**: 2.0 (Forensic-Enhanced)
**Status**: Production-Ready
