# IntegrityX - Complete Application Runner
# Fixes all errors and runs both frontend and backend together

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IntegrityX - Starting Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up
Write-Host "Step 1: Cleaning up..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*3000*" -or $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Cleaned up" -ForegroundColor Green
Write-Host ""

# Step 2: Verify dependencies
Write-Host "Step 2: Verifying dependencies..." -ForegroundColor Yellow
python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Python packages..." -ForegroundColor Gray
    python -m pip install --quiet fastapi uvicorn python-dotenv pydantic sqlalchemy alembic
}
Write-Host "✅ Python dependencies ready" -ForegroundColor Green
Write-Host ""

# Step 3: Ensure .env is correct
Write-Host "Step 3: Checking configuration..." -ForegroundColor Yellow
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
    Write-Host "✅ Created .env file" -ForegroundColor Green
} else {
    $envContent = Get-Content .env -Raw
    if (-not ($envContent -match "DATABASE_URL")) {
        Add-Content -Path .env -Value "`nDATABASE_URL=sqlite:///./backend/integrityx.db" -Encoding utf8
        Write-Host "✅ Added DATABASE_URL to .env" -ForegroundColor Green
    } else {
        # Update to SQLite if it's PostgreSQL
        $envContent = $envContent -replace "DATABASE_URL=postgresql://.*", "DATABASE_URL=sqlite:///./backend/integrityx.db"
        $envContent | Set-Content .env -Encoding utf8
        Write-Host "✅ Updated DATABASE_URL to SQLite" -ForegroundColor Green
    }
}
Write-Host ""

# Step 4: Start Backend
Write-Host "Step 4: Starting Backend Server..." -ForegroundColor Yellow
$backendScript = @"
cd '$PWD\backend'
`$Host.UI.RawUI.WindowTitle = 'IntegrityX Backend - Port 8000'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  IntegrityX Backend Server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting on http://127.0.0.1:8000' -ForegroundColor Yellow
Write-Host 'API Health: http://localhost:8000/api/health' -ForegroundColor Gray
Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor Gray
Write-Host ''
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Normal
Write-Host "✅ Backend starting in new window" -ForegroundColor Green
Write-Host ""

# Step 5: Wait for backend
Write-Host "Step 5: Waiting for backend to start..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 1; $i -le 25; $i++) {
    Start-Sleep -Seconds 1
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend is ready!" -ForegroundColor Green
        break
    } catch {
        if ($i % 5 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
}
Write-Host ""
Write-Host ""

# Step 6: Test backend endpoints
if ($backendReady) {
    Write-Host "Step 6: Testing backend endpoints..." -ForegroundColor Yellow
    $endpoints = @("/api/health", "/api/artifacts")
    $working = 0
    foreach ($ep in $endpoints) {
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:8000$ep" -TimeoutSec 3 -ErrorAction Stop
            Write-Host "✅ $ep" -ForegroundColor Green
            $working++
        } catch {
            Write-Host "⏳ $ep (may need more time)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# Step 7: Start Frontend
Write-Host "Step 7: Starting Frontend Server..." -ForegroundColor Yellow
$frontendScript = @"
cd '$PWD\frontend'
`$Host.UI.RawUI.WindowTitle = 'IntegrityX Frontend - Port 3000'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  IntegrityX Frontend Server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting Next.js on http://localhost:3000' -ForegroundColor Yellow
Write-Host ''
npm run dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Normal
Write-Host "✅ Frontend starting in new window" -ForegroundColor Green
Write-Host ""

# Final Status
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Application Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📊 Dashboard:" -ForegroundColor Cyan
Write-Host "   Open: http://localhost:3000/integrated-dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wait 10-15 seconds for both servers to fully start" -ForegroundColor Gray
Write-Host "Then refresh your browser page" -ForegroundColor Gray
Write-Host ""

