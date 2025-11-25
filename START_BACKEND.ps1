# IntegrityX Backend Startup Script
# Fixes all command line issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting IntegrityX Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set encoding for Windows console
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to backend directory
Set-Location "$PSScriptRoot\backend"

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    exit 1
}

# Check dependencies
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Yellow
python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    python -m pip install --quiet fastapi uvicorn python-dotenv pydantic sqlalchemy
}

# Start server
Write-Host ""
Write-Host "Starting server on http://localhost:8000..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

python start_server.py

