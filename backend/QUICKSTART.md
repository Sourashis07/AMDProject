# Quick Start Guide - Hackathon Demo

## 5-Minute Setup

### Prerequisites Check
```bash
# Check Python version
python --version  # Should be 3.11+

# Check MySQL
mysql --version

# Check Ollama
ollama --version
```

### Step 1: Install Ollama Model (2 minutes)
```bash
ollama pull llama3.1:8b
```

### Step 2: Setup Backend (2 minutes)
```bash
cd backend

# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh && ./setup.sh
```

### Step 3: Configure (1 minute)
```bash
# Edit .env file
# Minimum required:
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/agentic_ai
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### Step 4: Initialize Database
```bash
# Activate virtual environment first
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

python init_db.py
```

### Step 5: Run Application
```bash
python main.py
```

## Demo Scenarios

### Scenario 1: Document Upload and Processing

```bash
# Upload a document
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample_policy.txt"

# Check processing status
curl http://localhost:8000/documents/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Scenario 2: Intelligent Query

```bash
# Query the documents
curl -X POST http://localhost:8000/query/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "What is the remote work policy?",
    "organization_id": "demo_org"
  }'
```

### Scenario 3: View Agent Logs

```bash
# See what agents did
curl http://localhost:8000/logs/agents?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Demo Script

### Introduction (1 minute)
"We built a Local Enterprise Agentic AI System that processes documents and answers questions using AI, all running locally on your machine."

### Architecture Overview (2 minutes)
"The system uses:
- FastAPI backend for REST APIs
- MySQL for structured data
- ChromaDB for vector storage
- Llama 3.1 running locally via Ollama
- Multi-agent architecture with specialized agents
- Thread-based parallel processing optimized for AMD Ryzen CPUs"

### Live Demo (5 minutes)

#### Part 1: Upload Document
```bash
# Show the document first
cat demo_document.txt

# Upload it
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@demo_document.txt"

# Explain: "The system is now parsing, chunking, and embedding this document"
```

#### Part 2: Query Processing
```bash
# Ask a question
curl -X POST http://localhost:8000/query/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "What are the key points in this document?",
    "organization_id": "demo_org"
  }' | jq

# Explain: "The system:
# 1. Embedded the query
# 2. Retrieved relevant document chunks
# 3. Used Llama 3.1 to reason about the context
# 4. Generated a decision with confidence score"
```

#### Part 3: Show Agent Logs
```bash
# Show what happened behind the scenes
curl http://localhost:8000/logs/agents \
  -H "Authorization: Bearer $TOKEN" | jq

# Explain: "Each agent logged its execution time and results"
```

### Key Features Highlight (2 minutes)

1. **Local & Private**: "Everything runs on your machine. No data leaves your network."

2. **Multi-Agent System**: "Four specialized agents work together:
   - Parsing Agent: Cleans and chunks documents
   - Embedding Agent: Creates vector representations
   - Reasoning Agent: Understands context and generates answers
   - Action Agent: Makes decisions and suggests actions"

3. **Optimized for AMD**: "Uses thread pooling optimized for AMD Ryzen 7 CPUs with automatic core detection"

4. **Enterprise Ready**: "Firebase authentication, role-based access, organization isolation, comprehensive logging"

## Sample Documents for Demo

### demo_document.txt
```
Company Remote Work Policy

Effective Date: January 1, 2024

1. Eligibility
All full-time employees are eligible for remote work arrangements.

2. Remote Work Schedule
Employees may work remotely up to 3 days per week with manager approval.
Core hours (10 AM - 3 PM) must be maintained regardless of location.

3. Equipment
Company will provide:
- Laptop computer
- Monitor (upon request)
- Headset for video calls

4. Communication
Employees must be available via Slack and email during work hours.
Video calls are required for team meetings.

5. Performance
Remote work is a privilege that can be revoked if performance declines.
Regular check-ins with managers are mandatory.

6. Security
All company data must be accessed through VPN.
Personal devices are not permitted for work purposes.
```

## Troubleshooting During Demo

### Ollama Not Responding
```bash
# Quick fix
curl http://localhost:11434/api/tags

# If fails, restart Ollama
# Windows: System tray → Restart
# Linux: systemctl restart ollama
```

### Database Connection Error
```bash
# Check MySQL
mysql -u root -p -e "SHOW DATABASES;"

# If needed, create database
mysql -u root -p -e "CREATE DATABASE agentic_ai;"
```

### Port Already in Use
```bash
# Change port in .env
PORT=8001

# Or kill process on 8000
# Windows: netstat -ano | findstr :8000
# Linux: lsof -i :8000
```

## Presentation Tips

1. **Have everything pre-setup**: Run through the demo once before presenting

2. **Use environment variables for tokens**: 
   ```bash
   export TOKEN="your_firebase_token"
   ```

3. **Use jq for pretty JSON**: Install jq for formatted output

4. **Have backup screenshots**: In case live demo fails

5. **Prepare sample questions**: Have 3-4 interesting queries ready

6. **Show the code**: Briefly show the agent architecture in your IDE

7. **Highlight performance**: Show execution times in logs

## Questions You Might Get

**Q: Why local instead of cloud?**
A: Data privacy, no API costs, works offline, full control

**Q: How does it scale?**
A: Horizontal scaling with load balancer, vertical with more CPU/RAM

**Q: What about GPU?**
A: Ollama supports GPU, can be enabled for faster inference

**Q: Can it handle PDFs?**
A: Yes, add PyPDF2 library and extend parsing agent

**Q: How accurate is it?**
A: Depends on document quality and query, typically 80-90% for well-structured docs

**Q: What's the cost?**
A: Zero API costs, only hardware and electricity

## Post-Demo

### Share Access
```bash
# Find your local IP
ipconfig  # Windows
ifconfig  # Linux/Mac

# Share: http://YOUR_IP:8000
```

### Show Documentation
- API_DOCS.md - Complete API reference
- ARCHITECTURE.md - System design
- DEPLOYMENT.md - Production setup

### Next Steps
"We're planning to add:
- PDF and image processing
- Real-time streaming responses
- Advanced RAG with reranking
- Analytics dashboard
- Mobile app"

## Success Metrics to Highlight

- ✅ 100% local processing
- ✅ Sub-second query responses
- ✅ Parallel document processing
- ✅ Enterprise-grade security
- ✅ Production-ready architecture
- ✅ Comprehensive logging
- ✅ Easy deployment (Docker)
- ✅ Scalable design

Good luck with your demo! 🚀
