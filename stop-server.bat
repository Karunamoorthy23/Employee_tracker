@echo off
echo Stopping Proeduvate Server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)
echo Server stopped.
