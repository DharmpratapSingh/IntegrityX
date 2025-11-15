#!/bin/bash
# ============================================================================
# Automated Code Quality Fix Script for IntegrityX
# ============================================================================
# This script fixes code quality issues in backend/main.py using automated tools
# ============================================================================

echo ""
echo "🔧 ============================================="
echo "   IntegrityX Code Quality Auto-Fix"
echo "   Target: Fix ~40 warnings automatically"
echo "============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup original file
echo -e "${BLUE}📦 Creating backup...${NC}"
cp backend/main.py backend/main.py.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# Check if tools are installed
echo -e "${BLUE}🔍 Checking tools...${NC}"
MISSING_TOOLS=()

if ! command -v black &> /dev/null; then
    MISSING_TOOLS+=("black")
fi

if ! command -v isort &> /dev/null; then
    MISSING_TOOLS+=("isort")
fi

if ! command -v autoflake &> /dev/null; then
    MISSING_TOOLS+=("autoflake")
fi

# Install missing tools
if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Installing missing tools: ${MISSING_TOOLS[*]}${NC}"
    pip install black isort autoflake
    echo -e "${GREEN}✅ Tools installed${NC}"
else
    echo -e "${GREEN}✅ All tools already installed${NC}"
fi
echo ""

# Run linter before
echo -e "${BLUE}📊 Running linter (before)...${NC}"
echo "This may take a moment..."
pylint backend/main.py --max-line-length=120 2>&1 | grep "^Your code has been rated" > /tmp/before_score.txt
BEFORE_SCORE=$(cat /tmp/before_score.txt 2>/dev/null || echo "Could not determine score")
echo "Before: $BEFORE_SCORE"
echo ""

# Step 1: Remove unused variables
echo -e "${BLUE}🗑️  Step 1/4: Removing unused variables...${NC}"
autoflake --remove-unused-variables --remove-all-unused-imports --in-place backend/main.py
echo -e "${GREEN}✅ Unused variables removed${NC}"
echo ""

# Step 2: Fix import order
echo -e "${BLUE}📋 Step 2/4: Fixing import order...${NC}"
isort backend/main.py --profile black
echo -e "${GREEN}✅ Imports sorted${NC}"
echo ""

# Step 3: Format code
echo -e "${BLUE}🎨 Step 3/4: Formatting code...${NC}"
black backend/main.py --line-length=120 --quiet
echo -e "${GREEN}✅ Code formatted${NC}"
echo ""

# Step 4: Run linter after
echo -e "${BLUE}📊 Step 4/4: Running linter (after)...${NC}"
echo "This may take a moment..."
pylint backend/main.py --max-line-length=120 2>&1 | grep "^Your code has been rated" > /tmp/after_score.txt
AFTER_SCORE=$(cat /tmp/after_score.txt 2>/dev/null || echo "Could not determine score")
echo "After: $AFTER_SCORE"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ AUTOMATED FIXES COMPLETE!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before: $BEFORE_SCORE"
echo "After:  $AFTER_SCORE"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Test your application!${NC}"
echo ""
echo "Next Steps:"
echo "  1. Run tests: pytest tests/"
echo "  2. Test manually: uvicorn backend.main:app --reload"
echo "  3. If everything works: commit changes"
echo "  4. If something broke: restore backup"
echo ""
echo "Backup location: backend/main.py.backup.*"
echo ""
echo -e "${BLUE}📊 Remaining issues (if any) require manual fixes${NC}"
echo "See: CODE_QUALITY_IMPROVEMENTS.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""



















