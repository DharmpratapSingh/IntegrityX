# 🧪 IntegrityX - Demo Testing Guide

**Created**: January 2025
**Purpose**: Complete guide for testing IntegrityX with demo loan documents

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Demo Documents Overview](#demo-documents-overview)
3. [Testing Scenarios](#testing-scenarios)
4. [API Testing](#api-testing)
5. [Expected Results](#expected-results)

---

## 🚀 Quick Start

### Start the Application

```bash
# Option 1: Docker Compose (Recommended)
docker-compose up -d

# Option 2: Manual (if needed)
# Terminal 1: Database
docker-compose up postgres redis -d

# Terminal 2: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📁 Demo Documents Overview

I've created 4 demo loan documents for comprehensive testing:

### 1️⃣ **Clean Loan Application** ✅
**File**: `data/documents/demo_loan_application_clean.json`

**Profile**:
- **Borrower**: Sarah Johnson
- **Loan Amount**: $450,000
- **Purpose**: Home purchase
- **Credit Score**: 785 (Excellent)
- **Income**: $145,000/year
- **Status**: Clean, legitimate application

**Use Cases**:
- ✅ Test normal document upload
- ✅ Test blockchain sealing
- ✅ Test verification (should pass)
- ✅ Baseline for comparison

**Expected Behavior**:
- Should upload successfully
- Blockchain seal created
- No fraud alerts
- Risk score: LOW

---

### 2️⃣ **Tampered Loan Application** 🚨
**File**: `data/documents/demo_loan_application_tampered.json`

**What's Different** (compared to clean version):
- ❌ **Loan Amount**: $450,000 → **$650,000** (+44% increase!)
- ❌ **Income**: $145,000 → **$185,000** (+27% increase)
- ❌ **Interest Rate**: 6.75% → **5.25%** (-1.5% decrease)
- ❌ **Property Value**: $540,000 → **$740,000** (+37% increase)
- ❌ **Modified Date**: Changed to late night (11:45 PM)
- ❌ **Modified By**: Changed from borrower to loan officer

**Use Cases**:
- 🔬 **Test Visual Forensic Diff**: Should highlight ALL changes
- 🔬 **Test Risk Scoring**: Should flag high risk
- 🔬 **Test Timeline Analysis**: Should show suspicious late-night modification
- 🔬 **Test Pattern Detection**: Should detect amount manipulation

**Expected Behavior**:
- Visual diff shows red highlights on changed fields
- Risk score: HIGH (0.85-0.95)
- Suspicious patterns detected:
  - "Financial value modified - high fraud risk"
  - "Unusual modification time (late night)"
  - "Round number detected: $650,000"
  - "Modification by different user after submission"

---

### 3️⃣ **Fraudulent Loan Application** 🚨🚨🚨
**File**: `data/documents/demo_loan_application_fraudulent.json`

**Red Flags**:
- 🚨 **SSN Reuse**: Same SSN as clean application (123-45-6789)
- 🚨 **Duplicate Signature**: Same signature hash as clean application
- 🚨 **Address Reuse**: Same address as clean application
- 🚨 **Round Number**: Loan amount = $1,000,000 (exactly)
- 🚨 **High Risk Profile**:
  - Low credit score (620)
  - Outstanding judgments
  - High debt-to-income ratio
  - Incomplete documentation
  - Self-employed with suspiciously high income ($250K)
- 🚨 **Suspicious Timing**: Submitted at 2:15 AM
- 🚨 **Temporary Email**: Using tempmail.com

**Use Cases**:
- 🔬 **Test Pattern Detection Algorithms**:
  - Duplicate Signature Detection
  - Identity Reuse Detection
  - Amount Manipulation (round number)
  - Rapid Submissions (if uploaded multiple times)
- 🔬 **Test Risk Assessment**: Should flag CRITICAL risk
- 🔬 **Test Document DNA**: Should match 87% similar to clean doc (same structure)

**Expected Behavior**:
- Multiple CRITICAL alerts:
  - "🚨 CRITICAL: SSN found on multiple applications"
  - "🚨 CRITICAL: Identical signature found on different documents"
  - "⚠️ HIGH: Round number detected ($1,000,000)"
  - "⚠️ HIGH: Suspicious submission time (2:15 AM)"
  - "⚠️ MEDIUM: Same address used by different applicants"
- Risk score: CRITICAL (0.95+)
- Recommendation: "BLOCK DOCUMENT. Notify compliance team."

---

### 4️⃣ **Simple Personal Loan** ✅
**File**: `data/documents/demo_loan_application_simple.json`

**Profile**:
- **Borrower**: Emily Rodriguez
- **Loan Amount**: $25,000
- **Purpose**: Debt consolidation
- **Credit Score**: 720 (Good)

**Use Cases**:
- ✅ Quick testing
- ✅ Small document for performance testing
- ✅ Different document type (personal loan vs mortgage)

**Expected Behavior**:
- Fast upload (<1 second)
- Clean verification
- No alerts

---

## 🧪 Testing Scenarios

### **Scenario 1: Basic Upload & Verification** ✅

**Steps**:
1. Start the app: `docker-compose up -d`
2. Open frontend: http://localhost:3000
3. Upload `demo_loan_application_clean.json`
4. Note the ETID returned
5. Go to Verification page
6. Enter the ETID
7. Click "Verify"

**Expected Result**:
- ✅ Document uploaded successfully
- ✅ Walacor TX ID returned
- ✅ Verification shows: "Document is VERIFIED ✅"
- ✅ Hash matches blockchain
- ✅ No tampering detected

---

### **Scenario 2: Forensic Diff Analysis** 🔬

**Steps**:
1. Upload `demo_loan_application_clean.json` → Get ETID1
2. Upload `demo_loan_application_tampered.json` → Get ETID2
3. Go to Forensics page
4. Enter both ETIDs for comparison
5. Click "Compare Documents"

**Expected Result**:
- 🔍 Visual diff shows side-by-side comparison
- 🔴 Red highlights on:
  - loan_amount: $450,000 → $650,000
  - annual_income: $145,000 → $185,000
  - interest_rate: 6.75% → 5.25%
  - property_value: $540,000 → $740,000
- 📊 Risk score: HIGH (0.85-0.90)
- ⚠️ Suspicious patterns list:
  - "Multiple financial values modified"
  - "Suspicious round number: $650,000"
  - "Late-night modification detected"

---

### **Scenario 3: Pattern Detection** 🚨

**Steps**:
1. Upload `demo_loan_application_clean.json`
2. Upload `demo_loan_application_fraudulent.json`
3. Upload `demo_loan_application_simple.json`
4. Go to Pattern Detection Dashboard
5. Click "Scan All Documents"

**Expected Result**:
- 🚨 **Duplicate Signature Pattern**:
  - "Identical signature found on 2 documents"
  - Documents: [clean, fraudulent]
  - Severity: CRITICAL

- 🚨 **Identity Reuse Pattern**:
  - "Same SSN found on 2 different applications"
  - SSN: ***-**-6789
  - Severity: CRITICAL

- 🚨 **Address Reuse Pattern**:
  - "Same address used by different applicants"
  - Address: 456 Oak Avenue
  - Severity: MEDIUM

- ⚡ **Round Number Pattern**:
  - "Suspicious round number detected"
  - Amount: $1,000,000
  - Severity: MEDIUM

---

### **Scenario 4: Document DNA Similarity** 🧬

**Steps**:
1. Upload all 4 demo documents
2. Select `demo_loan_application_clean.json`
3. Click "Find Similar Documents"
4. Set threshold: 0.7 (70% similarity)

**Expected Result**:
- 📊 Similarity scores:
  - `demo_loan_application_tampered.json`: 87% similar
    - ✅ Same structure
    - ❌ Different content values
    - Analysis: "Likely derivative - same template, modified amounts"

  - `demo_loan_application_fraudulent.json`: 82% similar
    - ✅ Same document structure (both mortgages)
    - ❌ Different borrower info
    - Analysis: "Template-based - possible copy-paste fraud"

  - `demo_loan_application_simple.json`: 35% similar
    - ❌ Different structure (personal loan vs mortgage)
    - Analysis: "Different document type"

---

### **Scenario 5: Forensic Timeline** 📅

**Steps**:
1. Upload `demo_loan_application_clean.json` → ETID1
2. Modify it (upload as new version) → ETID2
3. Modify again → ETID3
4. Go to Forensic Timeline
5. Enter ETID3
6. View complete timeline

**Expected Result**:
- 📅 Interactive timeline showing:
  - [Jan 15, 10:30 AM] 📄 Document created ✓
  - [Jan 15, 10:30 AM] 🔗 Blockchain seal created ✓
  - [Jan 16, 11:45 PM] ✏️ Loan amount modified ⚠️ HIGH RISK
  - [Jan 16, 11:45 PM] ✏️ Interest rate modified ⚠️ HIGH RISK
  - [Jan 16, 11:46 PM] 🔒 Modified by different user 🚨 CRITICAL

- ⚠️ Suspicious patterns:
  - "Rapid successive modifications (2 changes within 1 minute)"
  - "Unusual access time (late night - 11:45 PM)"
  - "Unauthorized modification (different user)"

---

## 🔌 API Testing

### Using cURL

#### 1. Upload Document
```bash
curl -X POST "http://localhost:8000/ingest-json" \
  -H "Content-Type: application/json" \
  -d @data/documents/demo_loan_application_clean.json
```

**Response**:
```json
{
  "ok": true,
  "etid": "56f34957-bc30-4a42-9aa5-6233a0d71206",
  "walacor_tx_id": "TX_1234567890",
  "hash": "sha256:abc123...",
  "status": "sealed"
}
```

#### 2. Verify Document
```bash
curl -X POST "http://localhost:8000/api/verify" \
  -H "Content-Type: application/json" \
  -d '{"etid": "56f34957-bc30-4a42-9aa5-6233a0d71206"}'
```

#### 3. Compare Documents (Forensic Diff)
```bash
curl -X POST "http://localhost:8000/api/forensics/diff" \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_id_1": "ETID_CLEAN",
    "artifact_id_2": "ETID_TAMPERED",
    "include_overlay": true
  }'
```

#### 4. Detect Patterns
```bash
curl -X GET "http://localhost:8000/api/patterns/detect?limit=100"
```

#### 5. Get Forensic Timeline
```bash
curl -X GET "http://localhost:8000/api/forensics/timeline/ETID_HERE"
```

---

### Using Postman

1. Import the Postman collection:
   - File: `docs/api/IntegrityX.postman_collection.json`

2. Set environment variables:
   - `base_url`: http://localhost:8000
   - `etid_clean`: (after uploading clean doc)
   - `etid_tampered`: (after uploading tampered doc)

3. Run collection tests

---

## ✅ Expected Results Summary

| Test | Document | Expected Outcome |
|------|----------|------------------|
| **Upload** | Clean | ✅ Success, blockchain sealed |
| **Upload** | Tampered | ✅ Success, blockchain sealed |
| **Upload** | Fraudulent | ✅ Success, flagged for review |
| **Upload** | Simple | ✅ Success, quick processing |
| **Verify** | Clean | ✅ VERIFIED |
| **Verify** | Tampered (if original sealed) | 🚨 TAMPERED DETECTED |
| **Diff** | Clean vs Tampered | 🔴 4 major changes highlighted |
| **Pattern** | All docs | 🚨 3-4 CRITICAL patterns |
| **DNA** | Clean vs Tampered | 📊 87% similarity (derivative) |
| **Timeline** | Any modified doc | 📅 Complete event history + alerts |

---

## 🎯 Demo Script (5 Minutes)

**For judges/presentations**:

### **Part 1: Upload & Seal (1 min)**
> "Let me upload a loan application. Watch as it gets sealed to the Walacor blockchain."
>
> *Upload clean doc → Show ETID + Walacor TX ID*
>
> "This document is now immutably sealed. Any tampering will be detected."

---

### **Part 2: Tampering Detection (2 min)**
> "Now, someone modified this document - changed the loan amount from $450K to $650K."
>
> *Upload tampered doc → Go to Forensics → Compare*
>
> "See these red highlights? That's exactly what changed. Our forensic engine shows:
> - Loan amount: +44% increase
> - Interest rate: suspiciously decreased
> - Modified at 11:45 PM (unusual time)
> - Risk score: 89% - CRITICAL
>
> This is CSI for financial documents."

---

### **Part 3: Fraud Ring Detection (2 min)**
> "But it gets better. Watch this..."
>
> *Upload fraudulent doc → Go to Pattern Detection*
>
> "Our system just detected a fraud ring:
> - Same signature used on 2 different applications
> - Same SSN on multiple loans
> - Same address with different borrowers
>
> This is automated fraud investigation. No one else has this."

---

## 🐛 Troubleshooting

### Issue: "Walacor connection failed"
**Solution**:
```bash
# Check if Walacor endpoint is accessible
curl http://13.220.225.175:80/health

# If not, check backend/src/secure_config.py
# Ensure WALACOR_API_URL is set correctly
```

### Issue: "Database connection error"
**Solution**:
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Issue: "Frontend not loading"
**Solution**:
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### Issue: "Pattern detection shows no results"
**Solution**:
- Upload at least 2 documents with duplicate signatures/SSN
- Ensure documents have been processed (check `processing_status`)
- Try lowering the detection threshold

---

## 📊 Performance Benchmarks

**Expected Performance** (on local machine):

| Operation | Expected Time | Max Acceptable |
|-----------|--------------|----------------|
| Document Upload | < 2 sec | < 5 sec |
| Blockchain Seal | < 1 sec | < 3 sec |
| Verification | < 500 ms | < 2 sec |
| Forensic Diff | < 1 sec | < 3 sec |
| Pattern Detection (100 docs) | < 5 sec | < 10 sec |
| Timeline Analysis | < 500 ms | < 2 sec |

---

## 🎓 Next Steps

After testing with demo documents:

1. **Create Your Own Documents**:
   - Use the clean document as a template
   - Modify fields to test specific scenarios

2. **Test Bulk Operations**:
   - Upload multiple documents at once
   - Test pattern detection across large corpus

3. **Test API Integrations**:
   - Use Postman collection
   - Test all 89 API endpoints

4. **Performance Testing**:
   - Upload 100+ documents
   - Monitor Grafana dashboards
   - Check Prometheus metrics

5. **Security Testing**:
   - Test rate limiting
   - Test authentication
   - Test encryption

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Architecture Diagrams**: `ARCHITECTURE_DIAGRAMS_GUIDE.md`
- **Forensic Features**: `FORENSIC_FEATURES.md`
- **Walacor Integration**: `WALACOR_INTEGRATION_DEEP_DIVE.md`

---

**Happy Testing!** 🚀

If you encounter any issues, check the logs:
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres
```
