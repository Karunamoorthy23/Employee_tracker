# PowerShell script to start server with port cleanup
$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$env:PORT = "$port"
$env:BASE_URL = "http://localhost:$port/"
Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue

Write-Host "Stopping any existing server processes on port $port..." -ForegroundColor Yellow

# Find and kill processes using the configured port
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($processId in $processes) {
    if ($processId) {
        Write-Host "Killing process $processId" -ForegroundColor Red
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Waiting for port to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting Proeduvate Server..." -ForegroundColor Green
npm start
