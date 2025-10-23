# Duplicate Detection Test Plan

## Overview
This document outlines the comprehensive duplicate detection functionality implemented in the Walacor Financial Integrity platform.

## Features Implemented

### 1. Backend API Endpoints

#### `/api/duplicate-check` (POST)
- **Purpose**: Comprehensive duplicate detection
- **Parameters**:
  - `file_hash`: SHA-256 hash of the file
  - `loan_id`: Loan ID to check
  - `borrower_email`: Borrower email to check
  - `borrower_ssn_last4`: Borrower SSN last 4 digits
  - `content_hash`: Content hash for JSON files

#### `/api/duplicate-check/{artifact_id}` (GET)
- **Purpose**: Get detailed duplicate information for a specific artifact
- **Returns**: Related artifacts and duplicate relationships

### 2. Duplicate Detection Types

#### A. Exact File Match
- **Detection**: Same SHA-256 hash
- **Severity**: Critical
- **Action**: Block upload, suggest using existing document

#### B. Loan ID Match
- **Detection**: Same loan ID processed before
- **Severity**: Warning
- **Action**: Show existing documents, allow with confirmation

#### C. Borrower Information Match
- **Detection**: Same email or SSN last 4
- **Severity**: Warning
- **Action**: Show existing borrower documents, verify identity

#### D. Content Similarity
- **Detection**: Similar content in metadata
- **Severity**: Warning
- **Action**: Review for differences, allow with confirmation

### 3. Frontend Integration

#### DuplicateDetection Component
- **Location**: `frontend/components/DuplicateDetection.tsx`
- **Features**:
  - Real-time duplicate checking
  - Visual warnings and recommendations
  - Links to existing documents
  - Upload prevention with override option

#### Upload Page Integration
- **Location**: `frontend/app/(private)/upload/page.tsx`
- **Features**:
  - Automatic duplicate checking on file selection
  - Duplicate warning modal
  - Upload prevention with user override
  - Integration with existing upload flow

### 4. Database Compatibility
- **PostgreSQL**: Full support with advanced JSON queries
- **SQLite**: Compatible with simplified queries
- **Automatic Detection**: Database type detection and query adaptation

## Test Scenarios

### Scenario 1: No Duplicates
```bash
curl -X POST "http://localhost:8000/api/duplicate-check" \
  -H "Content-Type: application/json" \
  -d '{
    "file_hash": "new1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "loan_id": "LOAN_2024_002"
  }'
```
**Expected**: `is_duplicate: false`, safe to proceed

### Scenario 2: Exact File Match
```bash
curl -X POST "http://localhost:8000/api/duplicate-check" \
  -H "Content-Type: application/json" \
  -d '{
    "file_hash": "existing1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"
  }'
```
**Expected**: `is_duplicate: true`, `duplicate_type: "exact_file_match"`

### Scenario 3: Loan ID Match
```bash
curl -X POST "http://localhost:8000/api/duplicate-check" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "LOAN_2024_001"
  }'
```
**Expected**: `is_duplicate: true`, `duplicate_type: "loan_id_match"`

### Scenario 4: Borrower Match
```bash
curl -X POST "http://localhost:8000/api/duplicate-check" \
  -H "Content-Type: application/json" \
  -d '{
    "borrower_email": "john.doe@example.com",
    "borrower_ssn_last4": "1234"
  }'
```
**Expected**: `is_duplicate: true`, `duplicate_type: "borrower_match"`

## UI Flow

### 1. File Upload
1. User selects file
2. System calculates hash
3. DuplicateDetection component automatically checks
4. Results displayed in real-time

### 2. Duplicate Found
1. Warning displayed with details
2. User can review existing documents
3. User can proceed with override
4. Upload blocked until confirmation

### 3. No Duplicates
1. Green checkmark displayed
2. Upload proceeds normally
3. No additional warnings

## Security Features

### 1. Data Protection
- SSN last 4 digits only (not full SSN)
- Email matching for identity verification
- Content hash comparison for similarity

### 2. Audit Trail
- All duplicate checks logged
- User override actions tracked
- Document relationships maintained

### 3. Compliance
- GDPR-compliant data handling
- Financial regulation compliance
- Audit trail preservation

## Performance Considerations

### 1. Database Optimization
- Indexed queries on hash and loan_id
- Efficient JSON field searches
- Connection pooling

### 2. Caching
- Duplicate check results cached
- File hash calculations optimized
- Database query optimization

### 3. Scalability
- Horizontal scaling support
- Database sharding ready
- Microservice architecture compatible

## Error Handling

### 1. Database Errors
- Graceful fallback for connection issues
- Retry mechanisms for transient failures
- Clear error messages for users

### 2. API Errors
- Structured error responses
- HTTP status code compliance
- Detailed error logging

### 3. Frontend Errors
- User-friendly error messages
- Retry options for failed checks
- Fallback to manual verification

## Future Enhancements

### 1. Machine Learning
- Content similarity scoring
- Duplicate probability prediction
- Automated duplicate resolution

### 2. Advanced Analytics
- Duplicate pattern analysis
- User behavior insights
- System optimization recommendations

### 3. Integration
- External database integration
- Third-party duplicate detection
- Cross-system duplicate checking



