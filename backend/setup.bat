@echo off
echo ========================================
echo Enterprise Agentic AI System Setup
echo ========================================
echo.

echo [1/5] Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo Error creating virtual environment
    exit /b 1
)

echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/5] Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing dependencies
    exit /b 1
)

echo [4/5] Creating directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "chroma_db" mkdir chroma_db

echo [5/5] Creating .env file...
if not exist ".env" (
    copy .env.example .env
    echo Please edit .env file with your configuration
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Place firebase-credentials.json in this directory
echo 3. Ensure MySQL is running
echo 4. Ensure Ollama is running with llama3.1:8b model
echo 5. Run: python init_db.py
echo 6. Run: python main.py
echo.
pause
