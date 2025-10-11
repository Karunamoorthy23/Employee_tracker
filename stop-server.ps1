# PowerShell script to stop server
Write-Host "Stopping Proeduvate Server..." -ForegroundColor Yellow

# Find and kill processes using port 3001
$processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($pid in $processes) {
    if ($pid) {
        Write-Host "Killing process $pid" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Server stopped." -ForegroundColor Green
