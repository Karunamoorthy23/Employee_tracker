@echo off
echo Stopping Proeduvate Server...
set PORT=%PORT%
if "%PORT%"=="" set PORT=3000

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo Server stopped.
