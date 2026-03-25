#!/bin/bash

echo "========================================"
echo "  VocabRunner 4.5 - Starting..."
echo "========================================"

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "[INFO] node_modules not found. Installing dependencies..."
    npm install
fi

# Start the server in the background
echo "[INFO] Starting application server..."
npm run dev &
SERVER_PID=$!

# Wait for server to initialize
echo "[INFO] Waiting 5 seconds for server to be ready..."
sleep 5

# Detect if HTTPS should be used
if [ -f "key.pem" ] && [ -f "cert.pem" ]; then
    APP_URL="https://localhost:3443"
    echo "[INFO] SSL Certificates detected. Using HTTPS."
else
    APP_URL="http://localhost:3000"
fi

echo "[SUCCESS] Opening VocabRunner at $APP_URL"

# Open browser based on OS/Environment
if command -v xdg-open > /dev/null; then
    xdg-open "$APP_URL"
elif command -v open > /dev/null; then
    open "$APP_URL"
else
    echo "[WARN] Could not detect a browser opener. Please open $APP_URL manually."
fi

echo ""
echo "========================================"
echo "  Server is running (PID: $SERVER_PID)."
echo "  To stop, press Ctrl+C or kill the process."
echo "========================================"

# Keep script running to keep the background process alive if needed
wait $SERVER_PID
