#!/bin/bash

echo "========================================"
echo "Enterprise Agentic AI System Setup"
echo "========================================"
echo ""

echo "[1/5] Creating virtual environment..."
python3.11 -m venv venv
if [ $? -ne 0 ]; then
    echo "Error creating virtual environment"
    exit 1
fi

echo "[2/5] Activating virtual environment..."
source venv/bin/activate

echo "[3/5] Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error installing dependencies"
    exit 1
fi

echo "[4/5] Creating directories..."
mkdir -p logs uploads chroma_db

echo "[5/5] Creating .env file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

echo ""
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Place firebase-credentials.json in this directory"
echo "3. Ensure MySQL is running"
echo "4. Ensure Ollama is running with llama3.1:8b model"
echo "5. Run: python init_db.py"
echo "6. Run: python main.py"
echo ""
