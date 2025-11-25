# Fix Dashboard - Ensure Backend is Running
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing Dashboard - Starting Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing Python processes on port 8000
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object { 
    $port = netstat -ano | findstr ":8000" | findstr $_.Id
    $port
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"

# Start in new window so we can see logs
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info" -WindowStyle Normal

Set-Location "$PSScriptRoot"

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend is running!" -ForegroundColor Green
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ""

if ($backendReady) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Dashboard Should Work Now!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend: http://localhost:8000" -ForegroundColor White
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Cyan
    Write-Host "The dashboard should now display data!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend is taking longer to start" -ForegroundColor Yellow
    Write-Host "Check the backend window for any errors" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also start it manually:" -ForegroundColor White
    Write-Host "  cd backend" -ForegroundColor Gray
    Write-Host "  python -m uvicorn main:app --host 127.0.0.1 --port 8000" -ForegroundColor Gray
}

