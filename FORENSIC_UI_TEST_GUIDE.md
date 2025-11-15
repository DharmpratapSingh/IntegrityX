# Forensic UI Integration - Testing Guide

## ✅ Implementation Complete

All forensic UI components have been successfully integrated into the IntegrityX platform.

## 📋 Test Checklist

### 1. Navigation & Access
- [ ] Navigate to `/forensics` - Should see the Forensics page with hero section
- [ ] Check MainNav - "Forensics" link should appear with Search icon
- [ ] Verify active state highlighting works when on `/forensics`

### 2. Document Comparison Tab
- [ ] Enter two document IDs in the comparison form
- [ ] Click "Compare Documents" button
- [ ] Verify `ForensicDiffViewer` displays:
  - Summary card with risk badge
  - Statistics (Total Changes, Similarity, Suspicious Patterns)
  - Recommendation alert
  - View mode tabs (Side-by-Side, Overlay, Unified)
  - Changes list with risk indicators
  - Selected change details panel

### 3. Forensic Timeline Tab
- [ ] Enter a document ID
- [ ] Click "Load Timeline" button
- [ ] Verify `ForensicTimeline` displays:
  - Risk assessment card
  - Statistics cards (Total Events, Unique Users, High Risk Events, Patterns)
  - Investigation required alert (if applicable)
  - Filter dropdowns (Severity, Category)
  - Event timeline with timeline dots
  - Suspicious patterns section (if any)
  - Event details panel when event is clicked

### 4. Pattern Detection Tab
- [ ] Tab should auto-load patterns when selected
- [ ] Verify `PatternAnalysisDashboard` displays:
  - Summary cards (Documents Analyzed, Total Patterns, Critical, High Priority)
  - Critical patterns alert (if any)
  - Filter dropdown for pattern types
  - Pattern cards with severity badges
  - Pattern details panel when clicked

### 5. DNA Analysis Tab
- [ ] Enter a document ID
- [ ] Click "Create Fingerprint" button
- [ ] Verify `DocumentDNAViewer` displays:
  - Statistics (Field Count, Nested Depth, Keywords, Entities)
  - Layer tabs (Structural, Content, Style, Semantic, Combined)
  - Hash displays with copy buttons
  - Keywords and Entities sections
  - "Find Similar Documents" button
  - Similar documents list (after search)

### 6. Documents Page Integration
- [ ] Navigate to `/documents`
- [ ] Verify "Forensics" button appears in Actions column for each document
- [ ] Click "Forensics" button - Should navigate to `/forensics?document={id}` with timeline loaded

### 7. Verification Page Integration
- [ ] Verify a document on `/verification`
- [ ] After verification, scroll to "Forensic Analysis" section
- [ ] Verify links:
  - "View Forensic Timeline" - Should navigate with document ID
  - "Compare Documents" - Should navigate to forensics page
  - Tampering alert (if tampering detected)

## 🚀 Quick Start Testing

### Start the Backend
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Start the Frontend
```bash
cd frontend
npm run dev
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🧪 Test Scenarios

### Scenario 1: Document Comparison
1. Go to `/forensics`
2. Select "Document Comparison" tab
3. Enter two document IDs (use existing artifact IDs from your database)
4. Click "Compare Documents"
5. Verify all comparison features render correctly

### Scenario 2: Timeline Analysis
1. Go to `/forensics`
2. Select "Forensic Timeline" tab
3. Enter a document ID
4. Click "Load Timeline"
5. Test filters (Severity, Category)
6. Click on an event to see details

### Scenario 3: Pattern Detection
1. Go to `/forensics`
2. Select "Pattern Detection" tab
3. Verify patterns load automatically
4. Filter by pattern type
5. Click on a pattern to see details

### Scenario 4: DNA Fingerprinting
1. Go to `/forensics`
2. Select "DNA Analysis" tab
3. Enter a document ID
4. Click "Create Fingerprint"
5. Browse different layer tabs
6. Click "Find Similar Documents"
7. Verify similar documents list

### Scenario 5: From Documents Page
1. Go to `/documents`
2. Find a document in the table
3. Click "Forensics" button in Actions column
4. Verify you're taken to forensics page with timeline tab active

### Scenario 6: From Verification Page
1. Go to `/verification`
2. Verify a document
3. Scroll to "Forensic Analysis" section
4. Click "View Forensic Timeline"
5. Verify timeline loads with correct document

## 🐛 Known Issues & Notes

- **Linting Warnings**: Some unrelated linting warnings in `audit-log/page.tsx` (quote style) - these don't affect functionality
- **API Endpoints**: Ensure backend forensic endpoints are implemented and accessible
- **Mock Data**: For initial testing, you may want to add mock data handlers if backend isn't ready

## ✅ Component Verification

All components use:
- ✅ shadcn/ui components (Card, Badge, Button, Alert, Tabs, Select)
- ✅ Consistent color scheme and styling
- ✅ Responsive layouts
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Copy-to-clipboard functionality
- ✅ Proper TypeScript types

## 📝 Next Steps

1. **Backend Integration**: Ensure all forensic API endpoints return data in the expected format
2. **Error Handling**: Test error scenarios (invalid document IDs, network failures)
3. **Performance**: Test with large datasets
4. **Accessibility**: Verify keyboard navigation and screen reader support
5. **Browser Testing**: Test in Chrome, Firefox, Safari, Edge













