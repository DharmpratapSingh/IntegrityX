# IntegrityX Setup Script for Windows PowerShell
# This script sets up and runs the IntegrityX project

Write-Host "🚀 IntegrityX Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    @"
# =============================================================================
# WALACOR SERVICE CONFIGURATION
# =============================================================================
WALACOR_HOST=13.220.225.175
WALACOR_USERNAME=Admin
WALACOR_PASSWORD=Th!51s1T@gMu

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=INFO

# =============================================================================
# DOCUMENT PROCESSING CONFIGURATION
# =============================================================================
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,docx,doc,xlsx,xls,txt,jpg,png,tiff,json,xml

# =============================================================================
# AI/ML CONFIGURATION
# =============================================================================
ENABLE_OCR=true
ENABLE_DOCUMENT_CLASSIFICATION=true
ENABLE_AUTO_EXTRACTION=true

# =============================================================================
# DEMO MODE
# =============================================================================
DEMO_MODE=true

# =============================================================================
# STORAGE PATHS
# =============================================================================
STORAGE_PATH=data/documents
TEMP_PATH=data/temp
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ .env file created!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created!" -ForegroundColor Green
}

# Activate venv and install backend dependencies
Write-Host ""
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn python-dotenv pydantic
Write-Host "✅ Backend dependencies installed!" -ForegroundColor Green

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path "node_modules")) {
    npm install
    Write-Host "✅ Frontend dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}
Set-Location ..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the project:" -ForegroundColor Cyan
Write-Host "  1. Backend:  cd backend && ..\venv\Scripts\python.exe start_server.py" -ForegroundColor White
Write-Host "  2. Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""




