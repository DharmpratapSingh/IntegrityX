#!/bin/bash

# ============================================
# Quick Backend Start Script
# ============================================

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting IntegrityX Backend...${NC}"

# Check if venv exists
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo -e "${YELLOW}Run setup first: ./setup.sh${NC}"
    exit 1
fi

# Activate venv
source "$PROJECT_ROOT/venv/bin/activate"

# Verify FastAPI is installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${RED}❌ Dependencies not installed!${NC}"
    echo -e "${YELLOW}Run setup first: ./setup.sh${NC}"
    exit 1
fi

# Change to backend directory
cd "$SCRIPT_DIR"

# Start server
echo -e "${GREEN}✅ Starting server at http://localhost:8000${NC}"
python start_server.py
















