# PowerShell script to stop server
Write-Host "Stopping Proeduvate Server..." -ForegroundColor Yellow
$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }

# Find and kill processes using the configured port
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($processId in $processes) {
    if ($processId) {
        Write-Host "Killing process $processId" -ForegroundColor Red
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Server stopped." -ForegroundColor Green
