# Old Data Handling

## Current Status

### ✅ **Old Documents Will Work Fine**

The frontend already has robust fallback logic using optional chaining (`?.`) and default values (`||`). Old documents that don't have the new fields will:

1. **Display gracefully** - Missing fields show "Not provided" instead of errors
2. **Continue to function** - All existing functionality remains intact
3. **No breaking changes** - Old documents are fully compatible

### 📋 **What Old Documents Have vs. New Documents**

| Field | Old Documents | New Documents |
|-------|--------------|---------------|
| `loan_type` | ❌ Not present | ✅ Present |
| Conditional fields (property_value, vehicle_make, etc.) | ❌ Not present | ✅ Present (based on loan_type) |
| `ssn_or_itin_type` | ❌ Not present | ✅ Present |
| `ssn_or_itin_number` | ❌ Not present | ✅ Present |
| Basic borrower fields | ✅ Present | ✅ Present |

### 🔍 **How the Frontend Handles Missing Fields**

The document detail page uses this pattern for all fields:
```typescript
{borrower?.field || document.local_metadata?.comprehensive_document?.borrower?.field || 'Not provided'}
```

This means:
- First tries to get from API response (`borrower?.field`)
- Falls back to local_metadata (`document.local_metadata?.comprehensive_document?.borrower?.field`)
- Finally shows "Not provided" if neither exists

### 📝 **What Was Added**

1. **Display for Loan Type** - Now shows loan type (e.g., "Home Loan", "Auto Loan")
2. **Conditional Fields Display** - Shows relevant fields based on loan type:
   - Home loans: Property Value, Down Payment, Property Type
   - Auto loans: Vehicle Make, Model, Year
   - Business loans: Business Name, Business Type
   - Student loans: School Name, Degree Program
3. **SSN/ITIN Type Display** - Shows whether it's SSN or ITIN

### 🔄 **Migration Options**

If you want to backfill old documents with new fields, you would need:

1. **Original source data** - The original loan application data
2. **Migration script** - To update `local_metadata.comprehensive_document` in the database

**Note:** Without the original source data, migration is not possible. Old documents will continue to work but won't show the new fields.

### ✅ **Recommendation**

**No action needed!** Old documents will:
- ✅ Continue to work perfectly
- ✅ Display all existing fields correctly
- ✅ Show "Not provided" for new fields (which is expected)
- ✅ Not cause any errors or issues

New documents uploaded going forward will have all the new fields and display them correctly.
