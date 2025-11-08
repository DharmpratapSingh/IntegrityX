#!/bin/bash

echo "=============================================="
echo "  Fixing Tabs UI - Clear Cache & Rebuild"
echo "=============================================="

# Navigate to frontend
cd frontend

echo ""
echo "🧹 Clearing Next.js cache..."
rm -rf .next
echo "✅ .next folder removed"

echo ""
echo "🧹 Clearing node modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ node_modules cache cleared"

echo ""
echo "📦 Checking dependencies..."
if ! npm list @radix-ui/react-tabs > /dev/null 2>&1; then
    echo "⚠️  @radix-ui/react-tabs not found, installing..."
    npm install @radix-ui/react-tabs
else
    echo "✅ @radix-ui/react-tabs is installed"
fi

echo ""
echo "🔨 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Starting dev server..."
    echo ""
    npm run dev
else
    echo ""
    echo "❌ Build failed! Please check the errors above."
    echo ""
    echo "Common fixes:"
    echo "  1. Run: npm install"
    echo "  2. Check for TypeScript errors in upload/page.tsx"
    echo "  3. Run: npm run dev (to see detailed errors)"
fi
