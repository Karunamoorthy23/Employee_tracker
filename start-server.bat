@echo off
if not defined PORT set PORT=3000
set BASE_URL=http://localhost:%PORT%/
set MONGODB_URI=

echo Stopping any existing server processes on port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Waiting for port to be released...
timeout /t 2 /nobreak >nul

echo Starting Proeduvate Server...
npm start
