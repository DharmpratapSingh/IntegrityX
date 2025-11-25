# IntegrityX - Start All Services
# This script starts both backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IntegrityX - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item .env.example .env
    } else {
        @"
WALACOR_HOST=13.220.225.175
WALACOR_USERNAME=Admin
WALACOR_PASSWORD=Th!51s1T@gMu
LOG_LEVEL=INFO
DEMO_MODE=true
NEXT_PUBLIC_API_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Start Backend
Write-Host ""
Write-Host "Starting Backend Server (port 8000)..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath "python" -ArgumentList "backend\start_server.py" -WorkingDirectory "$PWD\backend" -WindowStyle Normal -PassThru

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check backend health
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend may still be starting..." -ForegroundColor Yellow
}

# Start Frontend
Write-Host ""
Write-Host "Starting Frontend Server (port 3000)..." -ForegroundColor Yellow
Set-Location frontend
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Keep script running
try {
    Wait-Process -Id $backendJob.Id -ErrorAction SilentlyContinue
} catch {
    # Script will exit when user presses Ctrl+C
}

