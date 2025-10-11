@echo off
echo Stopping any existing server processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Waiting for port to be released...
timeout /t 2 /nobreak >nul

echo Starting Proeduvate Server...
npm start
