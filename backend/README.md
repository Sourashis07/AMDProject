# Enterprise Agentic AI System

Local AI system with RAG capabilities, optimized for AMD Ryzen 7 7000 series CPUs.

## Architecture

- **Backend**: FastAPI + Python 3.11
- **Database**: MySQL (users, documents, logs, queries)
- **Vector DB**: ChromaDB (local persistent storage)
- **LLM**: Llama 3.1 8B via Ollama
- **Auth**: Firebase Authentication
- **Processing**: Thread-based parallel processing

## Prerequisites

1. **Python 3.11**
2. **MySQL 8.0**
3. **Ollama** - [Install from ollama.ai](https://ollama.ai)
4. **Firebase Project** - Create at [Firebase Console](https://console.firebase.google.com)

## Quick Start

### 1. Install Ollama and Pull Model

```bash
# Install Ollama (Windows)
# Download from https://ollama.ai/download

# Pull Llama model
ollama pull llama3.1:8b

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### 2. Setup Firebase

1. Create a Firebase project
2. Enable Email/Password authentication
3. Download service account credentials JSON
4. Save as `firebase-credentials.json` in backend folder

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env with your configuration
```

### 4. Configure Environment

Edit `.env` file:

```env
HOST=0.0.0.0
PORT=8000
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/agentic_ai
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
CHROMA_PERSIST_DIR=./chroma_db
MAX_WORKERS=8
```

### 5. Setup Database

```bash
# Start MySQL (if using Docker)
docker run -d \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=agentic_ai \
  -p 3306:3306 \
  mysql:8.0

# Or use local MySQL installation
# Create database manually:
mysql -u root -p
CREATE DATABASE agentic_ai;
```

### 6. Run Application

```bash
# Run directly
python main.py

# Or with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents/` - List documents
- `GET /documents/{id}` - Get document details

### Query
- `POST /query/` - Process RAG query
- `GET /query/history` - Get query history

### Logs
- `GET /logs/agents` - Get agent execution logs

## API Usage Examples

### Register User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_uid": "user123",
    "email": "user@example.com",
    "role": "employee",
    "organization_id": "org_001"
  }'
```

### Upload Document

```bash
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -F "file=@document.txt"
```

### Query Documents

```bash
curl -X POST http://localhost:8000/query/ \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "What is the company policy?",
    "organization_id": "org_001"
  }'
```

## Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py
│   │   ├── documents.py
│   │   ├── query.py
│   │   └── logs.py
│   ├── agents/           # Agent implementations
│   │   ├── base_agent.py
│   │   ├── parsing_agent.py
│   │   ├── embedding_agent.py
│   │   ├── reasoning_agent.py
│   │   └── action_agent.py
│   ├── orchestrator/     # Orchestration layer
│   │   ├── orchestrator.py
│   │   └── thread_manager.py
│   ├── services/         # External services
│   │   ├── chroma_service.py
│   │   ├── ollama_service.py
│   │   └── embedding_service.py
│   ├── models/           # Data models
│   │   ├── database_models.py
│   │   └── schemas.py
│   ├── config/           # Configuration
│   │   ├── settings.py
│   │   └── database.py
│   ├── middleware/       # Middleware
│   │   └── auth.py
│   └── utils/            # Utilities
│       └── logger.py
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── .env.example         # Environment template
```

## Agent Pipeline

1. **Parsing Agent**: Cleans and chunks documents
2. **Embedding Agent**: Generates vector embeddings
3. **Reasoning Agent**: Processes queries with context
4. **Action Agent**: Makes decisions and suggests actions

## Performance Optimization

- Thread pool sized based on CPU cores (AMD Ryzen 7)
- Parallel document processing
- Async API endpoints
- Connection pooling for database
- Persistent ChromaDB storage

## Hardware Requirements

- **CPU**: AMD Ryzen 7 7000 series (or equivalent)
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 20GB for models and data
- **Network**: LAN access for multi-device usage

## Troubleshooting

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
# Windows: Restart from system tray
# Linux: systemctl restart ollama
```

### Database Connection Issues
```bash
# Check MySQL is running
mysql -u root -p -e "SHOW DATABASES;"

# Verify connection string in .env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/agentic_ai
```

### Firebase Authentication Issues
- Verify `firebase-credentials.json` path
- Check Firebase project settings
- Ensure Email/Password auth is enabled

## Development

```bash
# Install dev dependencies
pip install pytest black flake8

# Run tests
pytest

# Format code
black app/

# Lint code
flake8 app/
```

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Use strong database passwords
3. Enable HTTPS/SSL
4. Configure firewall rules
5. Set up monitoring and logging
6. Regular backups of MySQL and ChromaDB

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
