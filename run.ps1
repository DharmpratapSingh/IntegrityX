# IntegrityX Run Script for Windows PowerShell
# This script starts both the backend and frontend servers

Write-Host "🚀 Starting IntegrityX..." -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found! Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Start backend in background
Write-Host "🔧 Starting backend server (port 8000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    & "..\venv\Scripts\python.exe" start_server.py
}

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting frontend server (port 3000)..." -ForegroundColor Yellow
Set-Location frontend
npm run dev

# Cleanup on exit
Write-Host ""
Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
Stop-Job $backendJob
Remove-Job $backendJob
Set-Location ..




