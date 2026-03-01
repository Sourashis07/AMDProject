@echo off
echo ========================================
echo Agentic AI Frontend Setup
echo ========================================
echo.

echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies
    exit /b 1
)

echo.
echo [2/2] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit src/firebase.js with your Firebase config
echo 2. Ensure backend is running on http://localhost:8000
echo 3. Run: npm start
echo 4. Open http://localhost:3000 in your browser
echo.
echo ========================================
pause
