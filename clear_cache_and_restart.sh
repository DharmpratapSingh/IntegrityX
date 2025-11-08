#!/bin/bash

echo "=============================================="
echo "  Clearing Python Cache & Restarting Backend"
echo "=============================================="

# Clear Python cache
echo ""
echo "🧹 Clearing Python cache files..."
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend -name "*.pyc" -delete 2>/dev/null || true
find backend -name "*.pyo" -delete 2>/dev/null || true
echo "✅ Cache cleared"

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo ""
    echo "🐳 Docker detected - Using Docker Compose"
    echo ""
    echo "Stopping containers..."
    docker-compose down

    echo ""
    echo "Removing old backend container..."
    docker-compose rm -f backend 2>/dev/null || true

    echo ""
    echo "Rebuilding and starting backend..."
    docker-compose up --build -d backend

    echo ""
    echo "✅ Backend restarted with Docker"
    echo ""
    echo "📊 Logs (Ctrl+C to exit):"
    docker-compose logs -f backend
else
    echo ""
    echo "⚠️  Docker not running - Please start backend manually:"
    echo ""
    echo "  cd backend"
    echo "  uvicorn main:app --reload --port 8000"
    echo ""
fi
