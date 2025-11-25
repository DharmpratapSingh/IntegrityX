#!/bin/bash

# ============================================
# IntegrityX Backend Setup Script
# ============================================

set -e  # Exit on error

echo "🚀 Starting IntegrityX Backend Setup..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}📁 Project root: $PROJECT_ROOT${NC}"

# Check Python version
echo -e "\n${YELLOW}🐍 Checking Python version...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✅ Found Python $PYTHON_VERSION${NC}"

# Check if venv exists
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo -e "\n${YELLOW}📦 Creating virtual environment...${NC}"
    cd "$PROJECT_ROOT"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "\n${GREEN}✅ Virtual environment already exists${NC}"
fi

# Activate venv
echo -e "\n${YELLOW}🔄 Activating virtual environment...${NC}"
source "$PROJECT_ROOT/venv/bin/activate"

# Upgrade pip
echo -e "\n${YELLOW}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip --quiet

# Install all dependencies
echo -e "\n${YELLOW}📚 Installing all dependencies from requirements.txt...${NC}"
pip install -r "$SCRIPT_DIR/requirements.txt" --quiet

# Verify critical packages
echo -e "\n${YELLOW}🔍 Verifying critical packages...${NC}"

packages=("fastapi" "uvicorn" "sqlalchemy" "sklearn" "argon2" "multipart")
all_installed=true

for package in "${packages[@]}"; do
    if python3 -c "import $package" 2>/dev/null; then
        echo -e "${GREEN}  ✅ $package${NC}"
    else
        echo -e "${RED}  ❌ $package (missing)${NC}"
        all_installed=false
    fi
done

if [ "$all_installed" = false ]; then
    echo -e "\n${RED}❌ Some packages failed to install${NC}"
    exit 1
fi

# Check database
echo -e "\n${YELLOW}🗄️  Checking database...${NC}"
if [ -f "$SCRIPT_DIR/integrityx.db" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database will be created on first run${NC}"
fi

# Print success message
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}To start the backend server:${NC}"
echo -e "  cd $SCRIPT_DIR"
echo -e "  source ../venv/bin/activate"
echo -e "  python start_server.py"

echo -e "\n${YELLOW}Or run directly:${NC}"
echo -e "  ./start_backend.sh"

echo -e "\n${YELLOW}Backend will be available at:${NC}"
echo -e "  ${GREEN}http://localhost:8000${NC}"

echo -e "\n${YELLOW}API Documentation:${NC}"
echo -e "  ${GREEN}http://localhost:8000/docs${NC}"

echo ""



















