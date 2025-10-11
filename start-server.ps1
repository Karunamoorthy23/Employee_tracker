# PowerShell script to start server with port cleanup
Write-Host "Stopping any existing server processes..." -ForegroundColor Yellow

# Find and kill processes using port 3001
$processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($pid in $processes) {
    if ($pid) {
        Write-Host "Killing process $pid" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Waiting for port to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting Proeduvate Server..." -ForegroundColor Green
npm start
