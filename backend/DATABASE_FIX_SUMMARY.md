# 🔧 Database Issue Resolution

## ❌ **Problem:**
Documents and Analytics pages showing "Unable to connect to server" due to database schema mismatch.

**Root Cause:**  
The database schema was out of sync - missing the `etid` column that the code expects.

## ✅ **Solution Applied:**

### 1. Created Proper Database Initialization Script
Created `backend/init_db.py` that:
- Uses absolute paths for database location
- Properly initializes all tables with correct schema
- Includes: artifacts (with etid column), artifact_files, artifact_events, attestations, deleted_documents, provenance_links

### 2. Fixed SQL Date Query
Changed PostgreSQL-specific syntax to SQLite-compatible:
```sql
# Before (PostgreSQL):
WHERE created_at >= NOW() - INTERVAL '24 hours'

# After (SQLite):
WHERE created_at >= datetime('now', '-24 hours')
```

### 3. Database Location
Database is now at: `/Users/dharmpratapsingh/ChallengeX/WalacorFinancialIntegrity/IntegrityX_Python/backend/integrityx.db`

## 📋 **Verification:**
```bash
# Check tables
sqlite3 backend/integrityx.db ".tables"
# Output: artifact_events, artifacts, attestations, artifact_files, deleted_documents, provenance_links

# Check etid column exists
sqlite3 backend/integrityx.db "PRAGMA table_info(artifacts);" | grep etid
# Output: 3|etid|INTEGER|1||0
```

## 🚀 **Next Steps:**
The server needs to use this new database. The issue is the server might be using a cached connection or in-memory database.

**Simple Fix**: Restart both servers fresh!
