# 📂 Working Files Reference - Walacor Hybrid Architecture

## Quick File Locator for GMU Challenge X Demo

This is your **quick reference** to show judges exactly where the hybrid architecture is implemented.

---

## 🎯 Core Implementation Files

### 1. **Database Service (SQL Layer)**
📁 **File:** `backend/src/database.py`  
📊 **Size:** 1,375 lines  
🔑 **Key Methods:**
- `insert_artifact()` - Lines 168-263
- `get_artifact()` - Lines 265+
- `log_document_upload()` - Audit logging
- `_ensure_session()` - Connection management

**Demo This:**
```python
# Line 100: Supports both SQLite and PostgreSQL
self.db_url = os.getenv('DATABASE_URL', 'sqlite:///:memory:')
```

---

### 2. **Blockchain Service (Walacor Layer)**
📁 **File:** `backend/src/walacor_service.py`  
📊 **Size:** 921 lines  
🔑 **Key Methods:**
- `seal_loan_document_hash()` - Lines 191-262
- `seal_loan_document()` - Lines 264-375
- `verify_document()` - Document verification
- `get_audit_trail()` - Blockchain history

**Demo This:**
```python
# Lines 223-230: HYBRID APPROACH comment
blockchain_data = {
    "document_hash": document_hash,
    "seal_timestamp": datetime.now().isoformat(),
    "etid": self.LOAN_DOCUMENTS_ETID
}

result["local_metadata"] = {
    "loan_id": loan_id,
    "file_size": file_size,
    "file_path": file_path
}
```

---

### 3. **Database Models (Schema Definitions)**
📁 **File:** `backend/src/models.py`  
📊 **Size:** 553 lines  
🔑 **Key Classes:**
- `Artifact` - Lines 27-110 (main document table)
- `ArtifactFile` - Lines 113-156 (file metadata)
- `ArtifactEvent` - Lines 159-203 (audit trail)

**Demo This:**
```python
# Lines 62-67: HYBRID BRIDGE FIELDS
walacor_tx_id = Column(String(255), nullable=False)  # Links to blockchain
blockchain_seal = Column(String(255))  # Blockchain proof
local_metadata = Column(JSON)  # File paths, sizes (SQL only)
borrower_info = Column(JSON)  # Encrypted PII (SQL only)
```

---

### 4. **API Endpoints (Integration Layer)**
📁 **File:** `backend/main.py`  
📊 **Size:** 7,445 lines  
🔑 **Key Endpoints:**
- `/api/seal-loan-document` - Lines 5268-5370
- `/api/upload-document` - Document upload flow
- `/api/verify/{loan_id}` - Verification endpoint
- `/health` - Health checks

**Demo This:**
```python
# Lines 114-126: Both services initialized together
db = Database(db_url=f"sqlite:///{db_path}")
wal_service = WalacorIntegrityService()

# Lines 5321-5327: Using both services
walacor_result = services["wal_service"].seal_loan_document(...)
artifact_id = services["db"].insert_artifact(
    walacor_tx_id=walacor_result["walacor_tx_id"]  # Bridge!
)
```

---

## 🧪 Test Files (Proof It Works)

### 5. **Integration Test**
📁 **File:** `tests/test_seal_loan_document.py`  
📊 **Size:** 120 lines  
🎯 **Purpose:** End-to-end test of hybrid architecture

**Run This:**
```bash
cd tests
python test_seal_loan_document.py
```

**Expected Output:**
```
✅ Walacor service initialized
✅ Loan document sealed successfully!
📊 Results:
  Transaction ID: TX_1729897200000_abc123
  Document Hash: 9f86d081884c7d65...
  ETID: 100005
  Blockchain Network: Walacor
```

---

## ⚙️ Configuration Files

### 6. **Environment Variables**
📁 **File:** `backend/.env`  
📊 **Size:** 108 lines  
🔑 **Critical Settings:**

```bash
# Line 15: SQL Database
DATABASE_URL=postgresql://dharmpratapsingh@localhost:5432/walacor_integrity

# Lines 21-24: Walacor Blockchain
WALACOR_HOST=13.220.225.175
WALACOR_USERNAME=Admin
WALACOR_PASSWORD=Th!51s1T@gMu
```

### 7. **PostgreSQL Setup Script**
📁 **File:** `backend/setup_postgresql.py`  
📊 **Size:** 236 lines  
🎯 **Purpose:** Automated database provisioning

**Run This:**
```bash
cd backend
python setup_postgresql.py
```

---

## 📖 Documentation Files

### 8. **Architecture Guide**
📁 **File:** `docs/ROBUST_PLATFORM_GUIDE.md`  
📊 **Size:** 390 lines  
📚 **Topics:**
- Hybrid architecture overview
- Production deployment
- Health monitoring
- Backup strategies

### 9. **Project Documentation**
📁 **File:** `docs/PROJECT_DOCUMENTATION.md`  
📊 **Size:** 1,296 lines  
📚 **Topics:**
- Complete system architecture
- API endpoints
- Security features
- Deployment guide

### 10. **This Implementation Guide**
📁 **File:** `HYBRID_ARCHITECTURE_IMPLEMENTATION.md`  
📊 **Created:** Just now  
📚 **Purpose:** Detailed evidence of hybrid architecture with code examples

---

## 🎬 Demo Script for Judges

### **30-Second Demo**

1. **Open Terminal 1 - Start Backend:**
   ```bash
   cd backend
   D:/IntegrityX/.venv/Scripts/uvicorn main:app --reload
   ```
   👉 **Point out:** "Both database and blockchain services initialized"

2. **Open Browser - Frontend:**
   ```
   http://localhost:3000
   ```
   👉 **Upload a document**, show it seals to both systems

3. **Open Terminal 2 - Check Database:**
   ```bash
   sqlite3 backend/integrityx.db
   SELECT loan_id, walacor_tx_id, payload_sha256 FROM artifacts LIMIT 1;
   ```
   👉 **Point out:** "SQL has metadata, `walacor_tx_id` links to blockchain"

4. **Open File - Show Code:**
   ```
   backend/src/walacor_service.py (Lines 223-230)
   ```
   👉 **Point out:** "Hash goes to blockchain, metadata stays local"

### **2-Minute Deep Dive**

1. **Architecture Overview**
   - Show diagram in `HYBRID_ARCHITECTURE_IMPLEMENTATION.md`
   - Explain data flow: Upload → Encrypt → Hash → Split

2. **Code Walkthrough**
   - Open `backend/main.py` line 5321
   - Show dual service calls in one endpoint
   - Highlight `walacor_tx_id` bridge field

3. **Live Verification**
   - Upload document in UI
   - Show SQL record created
   - Show blockchain transaction
   - Verify hash matches

4. **Benefits Explanation**
   - Cost: Only 64-byte hashes on blockchain
   - Privacy: PII stays in encrypted SQL
   - Performance: Fast queries on SQL
   - Trust: Immutable proof on blockchain

---

## 📊 File Size Summary

```
Core Implementation:
├── database.py           1,375 lines  ⭐ SQL layer
├── walacor_service.py      921 lines  ⭐ Blockchain layer
├── models.py               553 lines  ⭐ Schema definitions
└── main.py               7,445 lines  ⭐ API integration

Configuration:
├── .env                    108 lines  ⭐ Dual database URLs
└── setup_postgresql.py     236 lines  ⭐ Automated provisioning

Testing:
└── test_seal_loan_document.py  120 lines  ⭐ E2E proof

Documentation:
├── ROBUST_PLATFORM_GUIDE.md          390 lines
├── PROJECT_DOCUMENTATION.md        1,296 lines
└── HYBRID_ARCHITECTURE_IMPLEMENTATION.md  ⭐ This guide

Total Core Code: 10,294 lines of production-ready hybrid architecture
```

---

## 🔍 Quick Code Snippets for Judges

### **Snippet 1: Hybrid Data Separation**
```python
# backend/src/walacor_service.py, Lines 223-241

# HYBRID APPROACH: Only essential blockchain data goes to Walacor
blockchain_data = {
    "document_hash": document_hash,      # ← To blockchain
    "seal_timestamp": datetime.now(),
    "etid": self.LOAN_DOCUMENTS_ETID,
    "integrity_seal": f"SEAL_{document_hash[:16]}_..."
}

# Local metadata stored separately in database
result["local_metadata"] = {
    "loan_id": loan_id,                  # ← To SQL database
    "document_type": document_type,
    "file_size": file_size,
    "file_path": file_path,
    "uploaded_by": uploaded_by
}
```

### **Snippet 2: Bridge Field**
```python
# backend/src/models.py, Lines 62-67

class Artifact(Base):
    # SQL Database Fields
    loan_id = Column(String(255), nullable=False)
    
    # THE BRIDGE: Links SQL record to blockchain transaction
    walacor_tx_id = Column(String(255), nullable=False)  # ⭐
    payload_sha256 = Column(String(64), nullable=False)
    
    # Local-only metadata (NOT on blockchain)
    local_metadata = Column(JSON, nullable=True)
    borrower_info = Column(JSON, nullable=True)
```

### **Snippet 3: Dual Service Usage**
```python
# backend/main.py, Lines 5321-5339

# 1. Seal hash in blockchain (immutable)
walacor_result = services["wal_service"].seal_loan_document(
    loan_id=request.loan_id,
    loan_data=loan_data,
    borrower_data=encrypted_borrower_data,
    files=files_metadata
)

# 2. Store metadata in database (queryable)
artifact_id = services["db"].insert_artifact(
    loan_id=request.loan_id,
    walacor_tx_id=walacor_result["walacor_tx_id"],  # ⭐ The link!
    payload_sha256=walacor_result["document_hash"],
    local_metadata={...},
    borrower_info=encrypted_borrower_data
)
```

---

## ✅ Verification Commands

### **Check Both Systems Running:**
```bash
# Backend health (shows both services)
curl http://localhost:8000/api/health

# Database check
sqlite3 backend/integrityx.db "SELECT COUNT(*) FROM artifacts;"

# Walacor connection
curl http://localhost:8000/api/walacor/schemas
```

### **Test End-to-End Flow:**
```bash
# Seal a document
curl -X POST http://localhost:8000/api/seal-loan-document \
  -H "Content-Type: application/json" \
  -d @sample-loan-document.json

# Verify it
curl http://localhost:8000/api/verify/LOAN_2025_001
```

---

## 🎯 Key Takeaways

1. **File to Show for SQL Database:**
   - `backend/src/database.py` (1,375 lines)
   - `backend/src/models.py` (553 lines)

2. **File to Show for Blockchain:**
   - `backend/src/walacor_service.py` (921 lines)

3. **File to Show for Integration:**
   - `backend/main.py` (Lines 5268-5370)

4. **File to Show for Testing:**
   - `tests/test_seal_loan_document.py` (120 lines)

5. **File to Show for Configuration:**
   - `backend/.env` (Lines 15 + 21-24)

6. **File to Show for Architecture Diagram:**
   - `HYBRID_ARCHITECTURE_IMPLEMENTATION.md` (this document)

---

## 📞 Quick Demo Checklist

- [ ] Backend running (port 8000)
- [ ] Frontend running (port 3000)
- [ ] SQLite/PostgreSQL accessible
- [ ] Walacor connection verified
- [ ] Sample document ready
- [ ] Browser open to localhost:3000
- [ ] Terminal ready with `backend/integrityx.db` loaded
- [ ] Code editor open to `walacor_service.py` Lines 223-230
- [ ] This reference document open

---

**That's it! Everything you need to demonstrate the working hybrid architecture is in these 10 files.** 🚀
