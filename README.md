# Enterprise Agentic AI System

Complete local AI system with RAG capabilities, multi-agent architecture, and web interface.

## 🎯 Project Overview

A production-ready enterprise AI system that runs entirely on your local machine:
- **Backend**: FastAPI + Python with multi-agent architecture
- **Frontend**: React web application
- **Database**: MySQL for structured data
- **Vector DB**: ChromaDB for embeddings
- **LLM**: Llama 3.1 via Ollama (local)
- **Auth**: Firebase Authentication

## 🚀 Quick Start (10 Minutes)

### Prerequisites

Install these first:
1. **Python 3.11+** - [Download](https://www.python.org/downloads/)
2. **Node.js 16+** - [Download](https://nodejs.org/)
3. **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/)
4. **Ollama** - [Download](https://ollama.ai/download)
5. **Firebase Project** - [Create](https://console.firebase.google.com)

### Step 1: Install Ollama Model

```bash
ollama pull llama3.1:8b
```

### Step 2: Setup Backend

```bash
cd backend
setup.bat  # Windows (or ./setup.sh for Linux/Mac)

# Edit .env with your configuration
# Initialize database
python init_db.py
```

### Step 3: Setup Frontend

```bash
cd frontend
npm install

# Edit src/firebase.js with your Firebase config
```

### Step 4: Run Everything

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate  # Windows (or source venv/bin/activate)
python main.py

# Terminal 2 - Frontend
cd frontend
npm start
```

### Step 5: Access Application

Open browser: `http://localhost:3000`

## 📁 Project Structure

```
AMD/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── agents/         # AI Agents (Parsing, Embedding, Reasoning, Action)
│   │   ├── api/            # REST API Endpoints
│   │   ├── orchestrator/   # Agent Coordination
│   │   ├── services/       # External Services (Ollama, ChromaDB)
│   │   ├── models/         # Database Models
│   │   └── config/         # Configuration
│   ├── main.py             # Entry Point
│   ├── requirements.txt    # Python Dependencies
│   └── README.md           # Backend Documentation
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── services/      # API Client
│   │   └── firebase.js    # Firebase Config
│   ├── package.json       # Node Dependencies
│   └── README.md          # Frontend Documentation
│
└── TESTING_GUIDE.md       # Complete Testing Instructions
```

## ✨ Features

### Backend Features
- ✅ Multi-agent architecture (4 specialized agents)
- ✅ Thread-based parallel processing (AMD Ryzen optimized)
- ✅ RAG (Retrieval-Augmented Generation)
- ✅ Vector similarity search with ChromaDB
- ✅ Local LLM inference via Ollama
- ✅ Firebase authentication integration
- ✅ Comprehensive logging and monitoring
- ✅ Role-based access control
- ✅ Organization-based data isolation
- ✅ Docker support

### Frontend Features
- ✅ User authentication (Sign up/Login)
- ✅ Document upload and management
- ✅ Real-time processing status
- ✅ Interactive query interface
- ✅ AI response with decision analysis
- ✅ Query history tracking
- ✅ Agent execution logs viewer
- ✅ Responsive design

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────┐
│   FastAPI   │
│   Backend   │
└──────┬──────┘
       │
   ┌───┴───┬────────┬─────────┐
   │       │        │         │
┌──▼──┐ ┌─▼──┐ ┌───▼───┐ ┌──▼───┐
│MySQL│ │Chroma│ │Ollama│ │Firebase│
└─────┘ └────┘ └──────┘ └────────┘
```

### Agent Pipeline

```
Document Processing:
Upload → Parsing Agent → Embedding Agent → ChromaDB Storage

Query Processing:
Query → Embed → Retrieve Context → Reasoning Agent → Action Agent → Response
```

## 🔧 Configuration

### Backend (.env)
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/agentic_ai
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
MAX_WORKERS=8
```

### Frontend (src/firebase.js)
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};
```

## 📚 Documentation

- **[Backend README](backend/README.md)** - Backend setup and API docs
- **[Frontend README](frontend/README.md)** - Frontend setup and usage
- **[API Documentation](backend/API_DOCS.md)** - Complete API reference
- **[Architecture](backend/ARCHITECTURE.md)** - System design details
- **[Deployment Guide](backend/DEPLOYMENT.md)** - Production deployment
- **[Quick Start](backend/QUICKSTART.md)** - Hackathon demo guide
- **[Testing Guide](TESTING_GUIDE.md)** - Complete testing instructions

## 🧪 Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for complete testing instructions.

Quick test:
```bash
# 1. Start backend
cd backend && python main.py

# 2. Start frontend
cd frontend && npm start

# 3. Open http://localhost:3000
# 4. Sign up and upload a document
# 5. Ask questions about your document
```

## 🐳 Docker Deployment

```bash
cd backend
docker-compose up -d
```

This starts:
- MySQL database
- Backend API server

Note: Ollama must run on host machine.

## 🔐 Security

- Firebase authentication for user management
- JWT token-based API authentication
- Organization-based data isolation
- Role-based access control (Admin/Employee)
- No hardcoded credentials
- Environment-based configuration

## ⚡ Performance

Optimized for AMD Ryzen 7 7000 series:
- Automatic CPU core detection
- Configurable thread pool
- Parallel document processing
- Async API operations

Expected performance:
- Document upload: 1-2 seconds
- Document processing: 5-15 seconds
- Query response: 5-10 seconds (after model load)

## 🛠️ Tech Stack

### Backend
- FastAPI - Web framework
- SQLAlchemy - ORM
- MySQL - Database
- ChromaDB - Vector storage
- Ollama - LLM inference
- Firebase Admin - Authentication
- sentence-transformers - Embeddings

### Frontend
- React 18 - UI framework
- Firebase Auth - Authentication
- Axios - HTTP client

## 📊 API Endpoints

- `POST /auth/register` - User registration
- `GET /auth/me` - Current user info
- `POST /documents/upload` - Upload document
- `GET /documents/` - List documents
- `POST /query/` - Process query
- `GET /query/history` - Query history
- `GET /logs/agents` - Agent logs

## 🎓 Use Cases

1. **Enterprise Knowledge Base** - Upload company documents, ask questions
2. **Policy Assistant** - Query HR policies, procedures, guidelines
3. **Document Analysis** - Analyze contracts, reports, documents
4. **Customer Support** - Answer questions based on documentation
5. **Research Assistant** - Query research papers, articles

## 🚧 Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
python init_db.py
```

### Frontend won't start
```bash
cd frontend
npm install
```

### Ollama not responding
```bash
ollama serve
ollama pull llama3.1:8b
```

### Database connection error
```bash
mysql -u root -p -e "CREATE DATABASE agentic_ai;"
```

## 🔮 Future Enhancements

- [ ] PDF and image processing
- [ ] Real-time streaming responses
- [ ] Advanced RAG with reranking
- [ ] Multi-modal support
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] GPU acceleration
- [ ] Model fine-tuning

## 📝 License

MIT License

## 🤝 Contributing

This is a hackathon project. Feel free to fork and extend!

## 📧 Support

For issues:
1. Check documentation in respective README files
2. Review TESTING_GUIDE.md
3. Check logs (backend/logs/app.log)
4. Verify all prerequisites are installed

## 🎉 Demo Ready!

This system is ready for:
- ✅ Local testing
- ✅ Hackathon demos
- ✅ LAN deployment
- ✅ Production use (with proper security hardening)

## 🏆 Key Highlights

- **100% Local** - No cloud dependencies, complete privacy
- **Production-Ready** - Proper error handling, logging, security
- **Scalable** - Thread-based parallelism, modular architecture
- **Enterprise-Grade** - Authentication, authorization, multi-tenancy
- **Well-Documented** - Comprehensive docs and guides
- **Easy Setup** - Automated setup scripts
- **Docker Support** - Containerized deployment

---

Built with ❤️ for AMD Hackathon

**Hardware Optimized for:** AMD Ryzen 7 7000 Series CPUs
