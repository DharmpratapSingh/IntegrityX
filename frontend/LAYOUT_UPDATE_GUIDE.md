# 3-Column Layout Update Guide

## ✅ Completed
- ✓ Created `DashboardLayout` component (reusable across all pages)
- ✓ Updated Upload page with 3-column layout

## 📝 Pattern to Follow for Remaining Pages

For each page (Documents, Verification, Security, Analytics), follow this pattern:

### 1. Add Import
```tsx
import { DashboardLayout } from '@/components/DashboardLayout'
```

### 2. Wrap the Main Content

**Before:**
```tsx
return (
  <div className="min-h-screen bg-white dark:bg-black">
    {/* Page content here */}
  </div>
)
```

**After:**
```tsx
return (
  <DashboardLayout
    rightSidebar={
      <div className="p-6">
        {/* Custom right sidebar content for this page */}
      </div>
    }
  >
    <div>
      {/* Page content here - remove bg classes, handled by layout */}
    </div>
  </DashboardLayout>
)
```

### 3. Right Sidebar Examples

#### Documents Page
```tsx
rightSidebar={
  <div className="p-6">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
      Document Stats
    </h2>

    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Total Documents
      </h3>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {totalCount}
      </div>
    </div>

    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Filter Options
      </h3>
      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <div>• By Date Range</div>
        <div>• By Borrower</div>
        <div>• By Loan Amount</div>
        <div>• By Status</div>
      </div>
    </div>
  </div>
}
```

#### Verification Page
```tsx
rightSidebar={
  <div className="p-6">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
      Verification Info
    </h2>

    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        How to Verify
      </h3>
      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <div>1. Enter document hash or ID</div>
        <div>2. Click verify button</div>
        <div>3. Review blockchain proof</div>
      </div>
    </div>

    <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
        Need help?
      </h3>
      <p className="text-xs text-purple-700 dark:text-purple-300">
        Learn more about document verification
      </p>
    </div>
  </div>
}
```

#### Security Page
```tsx
rightSidebar={
  <div className="p-6">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
      Security Overview
    </h2>

    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Security Score
      </h3>
      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
        98/100
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Excellent
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Encryption Active
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        2FA Enabled
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Blockchain Protected
      </div>
    </div>
  </div>
}
```

#### Analytics Page
```tsx
rightSidebar={
  <div className="p-6">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
      Analytics Summary
    </h2>

    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        This Month
      </h3>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Documents Processed
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            1,247
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Verification Rate
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            99.2%
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
        Export Report
      </h3>
      <button className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400">
        📊 Download CSV
      </button>
    </div>
  </div>
}
```

## 🎨 Benefits

- **Left Sidebar**: Always visible navigation (consistent across all pages)
- **Main Content**: Your existing page content (responsive to XL breakpoint)
- **Right Sidebar**: Contextual info per page (hidden below XL breakpoint)

## 📱 Responsive Behavior

- **XL+ (1280px+)**: Full 3-column layout
- **LG (1024px+)**: Left sidebar + Main (right sidebar hidden)
- **MD/Mobile**: Main content only (sidebars in mobile menu)

## ✅ Warm Color Theme

All pages now use:
- Background: `#F8F7F4` (warm off-white)
- Accent: Purple/indigo (`#6366F1`, `#8B5CF6`)
- Clean white cards on warm background
