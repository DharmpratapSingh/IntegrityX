# IntegrityX - Complete Application Runner
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IntegrityX - Starting Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean up
Write-Host "Cleaning up..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Verify dependencies
Write-Host "Verifying dependencies..." -ForegroundColor Yellow
python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    python -m pip install --quiet fastapi uvicorn python-dotenv pydantic sqlalchemy
}
Write-Host "Dependencies ready" -ForegroundColor Green
Write-Host ""

# Check .env
Write-Host "Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    @"
WALACOR_HOST=13.220.225.175
WALACOR_USERNAME=Admin
WALACOR_PASSWORD=Th!51s1T@gMu
LOG_LEVEL=INFO
DEMO_MODE=true
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=sqlite:///./backend/integrityx.db
"@ | Out-File -FilePath .env -Encoding utf8
} else {
    $envContent = Get-Content .env -Raw
    if (-not ($envContent -match "DATABASE_URL")) {
        Add-Content -Path .env -Value "DATABASE_URL=sqlite:///./backend/integrityx.db" -Encoding utf8
    } else {
        $envContent = $envContent -replace "DATABASE_URL=postgresql://.*", "DATABASE_URL=sqlite:///./backend/integrityx.db"
        $envContent | Set-Content .env -Encoding utf8
    }
}
Write-Host "Configuration ready" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendCmd = "cd '$PWD\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal
Write-Host "Backend starting..." -ForegroundColor Green
Write-Host ""

# Wait for backend
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$ready = $false
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
        Write-Host "Backend is ready!" -ForegroundColor Green
        break
    } catch {
        if ($i % 5 -eq 0) { Write-Host "." -NoNewline }
    }
}
Write-Host ""
Write-Host ""

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendCmd = "cd '$PWD\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal
Write-Host "Frontend starting..." -ForegroundColor Green
Write-Host ""

# Final Status
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Dashboard: http://localhost:3000/integrated-dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wait 10-15 seconds, then refresh your browser" -ForegroundColor Gray
Write-Host ""

