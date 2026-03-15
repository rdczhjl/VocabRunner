@echo off
title VocabRunner Startup
echo ========================================
echo   VocabRunner 3.18 - Starting...
echo ========================================

:: Check for node_modules
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)

:: Start the server in the background
echo [INFO] Starting application server...
start /b npm run dev

:: Wait for server to initialize
echo [INFO] Waiting 5 seconds for server to be ready...
timeout /t 5 /nobreak > nul

:: Detect if HTTPS should be used
set APP_URL=http://localhost:3000
if exist key.pem (
    if exist cert.pem (
        set APP_URL=https://localhost:3443
        echo [INFO] SSL Certificates detected. Using HTTPS.
    )
)

echo [SUCCESS] Opening VocabRunner at %APP_URL%
start %APP_URL%

echo.
echo ========================================
echo   Server is running in the background.
echo   To stop, close this window or press Ctrl+C.
echo ========================================
pause > nul
