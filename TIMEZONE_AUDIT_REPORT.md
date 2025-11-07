# Timezone Audit Report
**Date:** November 1, 2025
**Status:** ⚠️ Inconsistencies Found

---

## Executive Summary

Your project is **mostly configured for New York time (America/New_York)**, but there are **several inconsistencies** where UTC time is being used instead. This could cause confusion when comparing timestamps across different parts of the system.

**Overall Status:**
- ✅ Database: Correctly set to `America/New_York`
- ✅ Timezone Utilities: Excellent implementation in `timezone_utils.py`
- ⚠️ Models: 2 models use UTC instead of Eastern time
- ⚠️ Backend API: Multiple endpoints use UTC timestamps
- ⚠️ Frontend: Uses browser's local timezone (not NY time)

---

## 1. Database Configuration ✅

### PostgreSQL Timezone Setting
**File:** PostgreSQL Server Configuration
**Status:** ✅ **CORRECT**

```sql
SHOW timezone;
-- Result: America/New_York
```

**Conclusion:** Database is correctly configured for New York time.

---

## 2. Backend Timezone Utilities ✅

### Timezone Utils Implementation
**File:** `backend/src/timezone_utils.py`
**Status:** ✅ **EXCELLENT**

You have a comprehensive timezone utility module:

```python
EASTERN_TZ = pytz.timezone('America/New_York')

def get_eastern_now() -> datetime:
    """Get current time in Eastern Time zone."""
    return datetime.now(EASTERN_TZ)

def eastern_datetime_default():
    """Default function for SQLAlchemy DateTime columns."""
    return get_eastern_now()
```

**Available Functions:**
- ✅ `get_eastern_now()` - Current NY time
- ✅ `get_eastern_now_iso()` - ISO string in NY time
- ✅ `utc_to_eastern()` - Convert UTC to NY
- ✅ `eastern_to_utc()` - Convert NY to UTC
- ✅ `format_eastern_time()` - Format timestamps
- ✅ `eastern_datetime_default()` - SQLAlchemy default

**Conclusion:** Perfect utility implementation. The problem is that it's not being used consistently.

---

## 3. Database Models (Inconsistencies Found) ⚠️

### Models Using Eastern Time ✅

**File:** `backend/src/models.py`

**Correct Models:**
1. ✅ **Artifact** (line 63): `created_at = Column(DateTime(timezone=True), default=eastern_datetime_default)`
2. ✅ **ArtifactEvent** (line 196): `created_at = Column(DateTime(timezone=True), default=eastern_datetime_default)`
3. ✅ **Attestation** (line 257): `created_at = mapped_column(DateTime(timezone=True), default=eastern_datetime_default)`
4. ✅ **BulkOperation** (line 495): `created_at = Column(DateTime(timezone=True), default=eastern_datetime_default)`

### Models Using UTC Time ❌

**File:** `backend/src/models.py`

**ISSUE #1 - Provenance Model** (Line 311):
```python
# WRONG - Uses UTC instead of Eastern
created_at = mapped_column(
    DateTime(timezone=True),
    default=lambda: datetime.now(timezone.utc),  # ❌ UTC
    nullable=False
)
```

**SHOULD BE:**
```python
# CORRECT - Use Eastern time
created_at = mapped_column(
    DateTime(timezone=True),
    default=eastern_datetime_default,  # ✅ Eastern
    nullable=False
)
```

**ISSUE #2 - DeletedArtifact Model** (Line 387):
```python
# WRONG - Uses UTC instead of Eastern
deleted_at = Column(
    DateTime(timezone=True),
    default=lambda: datetime.now(timezone.utc),  # ❌ UTC
    nullable=False
)
```

**SHOULD BE:**
```python
# CORRECT - Use Eastern time
deleted_at = Column(
    DateTime(timezone=True),
    default=eastern_datetime_default,  # ✅ Eastern
    nullable=False
)
```

**Impact:**
- Provenance timestamps will be in UTC
- Deleted artifact timestamps will be in UTC
- All other timestamps will be in Eastern time
- This creates **confusing audit trails** where times don't match

---

## 4. Backend API Endpoints (Inconsistencies Found) ⚠️

### Endpoints Using Eastern Time ✅

**File:** `backend/main.py`

**Correct Usage:**
```python
# Line 786
timestamp = get_eastern_now_iso()  # ✅ CORRECT

# Line 1804
"timestamp": get_eastern_now_iso()  # ✅ CORRECT

# Line 2327
"timestamp": get_eastern_now_iso()  # ✅ CORRECT

# Line 2450
"sealed_at": get_eastern_now_iso()  # ✅ CORRECT

# Line 2563, 2608
"verified_at": get_eastern_now_iso()  # ✅ CORRECT
```

### Endpoints Using UTC Time ❌

**File:** `backend/main.py`

**ISSUE #3 - Multiple API Responses Use UTC:**

```python
# Line 1727-1728 - Walacor fallback
"tx_id": "WAL_TX_JSON_" + datetime.now().strftime("%Y%m%d%H%M%S"),  # ❌ Uses local time
"upload_timestamp": datetime.now().isoformat(),  # ❌ Uses local time

# Line 1948 - JSON sealing
"timestamp": datetime.now(timezone.utc).isoformat()  # ❌ UTC

# Line 2012 - Document extraction
"extraction_timestamp": datetime.now(timezone.utc).isoformat()  # ❌ UTC

# Line 2052 - Document packet endpoint
"timestamp": datetime.now(timezone.utc).isoformat()  # ❌ UTC

# Line 2338 - Upload directory endpoint
"timestamp": datetime.now(timezone.utc).isoformat()  # ❌ UTC

# Line 2727 - Verification endpoint
"retrieved_at": datetime.now(timezone.utc).isoformat()  # ❌ UTC
```

**Impact:**
- Some API responses have Eastern timestamps
- Some API responses have UTC timestamps
- Clients/frontend can't rely on consistent timezone

---

## 5. Frontend Time Display (Inconsistencies) ⚠️

### How Frontend Handles Time

**File:** `frontend/app/(private)/integrated-dashboard/page.tsx`

```tsx
// Line 53, 188 - Uses browser's local timezone
lastUpdated: new Date().toLocaleString()  // ⚠️ Browser timezone
```

**File:** `frontend/app/documents/page.tsx`

```tsx
// Line 340 - PDF report generation
pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45)  // ⚠️ Browser timezone

// Line 383, 429, 456 - Export timestamps
new Date().toISOString()  // ⚠️ UTC (ISO standard)
```

**Issue:**
- Frontend uses `toLocaleString()` which displays in **user's browser timezone**
- A user in California will see Pacific time
- A user in New York will see Eastern time
- A user in London will see GMT/BST
- Backend sends timestamps in Eastern time
- Frontend doesn't convert them to display consistently

**Example Problem:**
- Document created at: `2025-11-01T10:30:00-05:00` (10:30 AM Eastern)
- User in California sees: `11/01/2025, 7:30:00 AM` (converted to Pacific)
- User in New York sees: `11/01/2025, 10:30:00 AM` (stays Eastern)
- But the dashboard "Last Updated" will show their current local time

---

## 6. Impact Analysis

### What This Means for Your Application

#### Current Behavior:

| Component | Timezone | Example Timestamp |
|-----------|----------|-------------------|
| **Database** | Eastern | `2025-11-01 10:30:00-05` |
| **Artifact.created_at** | Eastern | `2025-11-01T10:30:00-05:00` |
| **Provenance.created_at** | UTC | `2025-11-01T15:30:00+00:00` ❌ |
| **DeletedArtifact.deleted_at** | UTC | `2025-11-01T15:30:00+00:00` ❌ |
| **Some API responses** | Eastern | `2025-11-01T10:30:00-05:00` |
| **Other API responses** | UTC | `2025-11-01T15:30:00+00:00` ❌ |
| **Frontend Display** | User's Browser | Varies by user location ⚠️ |

#### Real-World Scenario:

**Audit Log Entry:**
```
10:30 AM - Document uploaded (Artifact.created_at - Eastern)
3:30 PM  - Provenance link created (Provenance.created_at - UTC, looks like 5 hours later!)
10:30 AM - Verification completed (API response - Eastern)
3:30 PM  - Document deleted (DeletedArtifact.deleted_at - UTC, looks like 5 hours later!)
```

**User Confusion:**
- "Why was provenance created 5 hours after upload?"
- "Why was document deleted 5 hours after verification?"
- Answer: It wasn't! It's the same time, just different timezones.

---

## 7. Recommendations

### Priority 1: Fix Database Models (5 minutes)

**File:** `backend/src/models.py`

**Fix Provenance Model (Line 311):**
```python
# Change from:
created_at = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

# To:
created_at = mapped_column(DateTime(timezone=True), default=eastern_datetime_default, nullable=False)
```

**Fix DeletedArtifact Model (Line 387):**
```python
# Change from:
deleted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

# To:
deleted_at = Column(DateTime(timezone=True), default=eastern_datetime_default, nullable=False)
```

**Migration Required:** Yes - existing data will need to be converted from UTC to Eastern

---

### Priority 2: Fix Backend API Responses (10 minutes)

**File:** `backend/main.py`

**Replace all instances of:**
```python
datetime.now(timezone.utc).isoformat()  # ❌ Wrong
datetime.now().isoformat()              # ❌ Wrong
datetime.now().strftime(...)            # ❌ Wrong
```

**With:**
```python
get_eastern_now_iso()  # ✅ Correct
```

**Affected Lines:** 1727, 1728, 1735, 1892, 1948, 2012, 2052, 2338, 2727

**Search & Replace:**
```bash
# In backend/main.py, replace:
datetime.now(timezone.utc).isoformat()
# with:
get_eastern_now_iso()

# And replace:
datetime.now().isoformat()
# with:
get_eastern_now_iso()
```

---

### Priority 3: Fix Frontend Display (Optional - 30 minutes)

**Option A: Always Display Eastern Time (Recommended for Financial Apps)**

Create a utility function:

**File:** `frontend/utils/timezone.ts` (NEW FILE)
```typescript
export function formatEasternTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })
}

export function getCurrentEasternTime(): string {
  return formatEasternTime(new Date())
}
```

**Update dashboard:**
```tsx
// frontend/app/(private)/integrated-dashboard/page.tsx
import { getCurrentEasternTime } from '@/utils/timezone'

// Change line 53, 188:
lastUpdated: getCurrentEasternTime()  // Always shows Eastern time
```

**Option B: Show Both Times (Best for International Users)**

```tsx
// Show: "10:30 AM EST (7:30 AM PST)"
function formatWithBothTimes(date: Date): string {
  const eastern = date.toLocaleString('en-US', { timeZone: 'America/New_York' })
  const local = date.toLocaleString()
  return local === eastern ? eastern : `${eastern} (${local} local)`
}
```

---

## 8. Migration Script for Existing Data

### If You Fix the Models, Run This Migration

**File:** `backend/alembic/versions/fix_timezone_consistency.py` (NEW FILE)

```python
"""
Fix timezone consistency - convert Provenance and DeletedArtifact timestamps from UTC to Eastern

Revision ID: fix_timezone_consistency
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    # Convert Provenance.created_at from UTC to Eastern (subtract 4-5 hours depending on DST)
    op.execute("""
        UPDATE provenance
        SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York'
        WHERE created_at IS NOT NULL;
    """)

    # Convert DeletedArtifact.deleted_at from UTC to Eastern
    op.execute("""
        UPDATE deleted_documents
        SET deleted_at = deleted_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York'
        WHERE deleted_at IS NOT NULL;
    """)

    # Convert original_created_at as well
    op.execute("""
        UPDATE deleted_documents
        SET original_created_at = original_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York'
        WHERE original_created_at IS NOT NULL;
    """)

def downgrade():
    # Revert Eastern to UTC (add 4-5 hours)
    op.execute("""
        UPDATE provenance
        SET created_at = created_at AT TIME ZONE 'America/New_York' AT TIME ZONE 'UTC'
        WHERE created_at IS NOT NULL;
    """)

    op.execute("""
        UPDATE deleted_documents
        SET deleted_at = deleted_at AT TIME ZONE 'America/New_York' AT TIME ZONE 'UTC'
        WHERE deleted_at IS NOT NULL;
    """)

    op.execute("""
        UPDATE deleted_documents
        SET original_created_at = original_created_at AT TIME ZONE 'America/New_York' AT TIME ZONE 'UTC'
        WHERE original_created_at IS NOT NULL;
    """)
```

**Run migration:**
```bash
cd backend
alembic revision --autogenerate -m "Fix timezone consistency"
# Edit the generated file to add the SQL above
alembic upgrade head
```

---

## 9. Testing Checklist

### After Fixing, Verify:

**Backend:**
- [ ] Create a new artifact - check `created_at` timezone
- [ ] Create provenance link - check `created_at` timezone
- [ ] Delete a document - check `deleted_at` timezone
- [ ] All timestamps should show `-05:00` (EST) or `-04:00` (EDT) offset
- [ ] No timestamps should show `+00:00` (UTC) offset

**API Responses:**
- [ ] Upload document - check `timestamp` field
- [ ] Verify document - check `verified_at` field
- [ ] All responses should use Eastern time

**Frontend:**
- [ ] Dashboard "Last Updated" shows Eastern time with timezone label
- [ ] Export timestamps are consistent
- [ ] Audit logs show sequential times (no 5-hour jumps)

**Database:**
```sql
-- Check all timestamps are in Eastern timezone
SELECT
    id,
    created_at,
    EXTRACT(TIMEZONE FROM created_at) as tz_offset_seconds
FROM artifacts
LIMIT 5;

-- Eastern time offset is -18000 (EST) or -14400 (EDT) seconds from UTC
-- Should see -18000 or -14400, NOT 0 (which would be UTC)
```

---

## 10. Summary

### Current State:

| Category | Status | Issue Count |
|----------|--------|-------------|
| Database | ✅ Correct | 0 |
| Timezone Utils | ✅ Excellent | 0 |
| Database Models | ⚠️ Inconsistent | 2 models |
| Backend API | ⚠️ Inconsistent | ~8 endpoints |
| Frontend | ⚠️ Browser timezone | All displays |

### Recommended Action:

**Essential (Do Now):**
1. ✅ Fix `Provenance.created_at` to use `eastern_datetime_default`
2. ✅ Fix `DeletedArtifact.deleted_at` to use `eastern_datetime_default`
3. ✅ Replace all `datetime.now(timezone.utc)` with `get_eastern_now_iso()` in `main.py`
4. ✅ Run database migration to convert existing UTC timestamps

**Important (Do Soon):**
5. ⭐ Add frontend timezone utility to always display Eastern time
6. ⭐ Update all `new Date().toLocaleString()` calls

**Nice to Have:**
7. 💡 Add timezone indicator to all displayed timestamps ("EST" / "EDT")
8. 💡 Add user preference for timezone display (if international users)

### Time Estimate:

- **Backend fixes:** 15-20 minutes
- **Database migration:** 5 minutes
- **Frontend fixes:** 30 minutes
- **Testing:** 15 minutes
- **Total:** ~1 hour for complete timezone consistency

---

## 11. Quick Reference

### When to Use What:

**In Database Models:**
```python
from .timezone_utils import eastern_datetime_default

created_at = Column(DateTime(timezone=True), default=eastern_datetime_default)
```

**In API Endpoints:**
```python
from src.timezone_utils import get_eastern_now_iso

response = {"timestamp": get_eastern_now_iso()}
```

**In Frontend (After creating utility):**
```typescript
import { formatEasternTime, getCurrentEasternTime } from '@/utils/timezone'

// Display stored timestamp
const displayTime = formatEasternTime(document.created_at)

// Get current Eastern time
const now = getCurrentEasternTime()
```

---

**Report Generated:** November 1, 2025
**Audit Status:** ⚠️ Inconsistencies found - fixes recommended
**Priority:** Medium (not breaking, but confusing for users)
