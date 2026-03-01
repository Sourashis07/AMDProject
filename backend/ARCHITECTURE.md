# System Architecture

## Overview

Enterprise Agentic AI System is a local RAG (Retrieval-Augmented Generation) system designed for enterprise document processing and intelligent querying.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web/Mobile App with Firebase Authentication)              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     FastAPI Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Layer (FastAPI)                      │  │
│  │  - Auth Endpoints    - Document Endpoints             │  │
│  │  - Query Endpoints   - Logs Endpoints                 │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │           Orchestrator Layer                          │  │
│  │  - Coordinates agent workflow                         │  │
│  │  - Manages thread pool                                │  │
│  │  - Handles async operations                           │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │              Agent Layer                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Parsing  │  │Embedding │  │Reasoning │           │  │
│  │  │  Agent   │  │  Agent   │  │  Agent   │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │  ┌──────────┐                                         │  │
│  │  │  Action  │                                         │  │
│  │  │  Agent   │                                         │  │
│  │  └──────────┘                                         │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │            Services Layer                             │  │
│  │  - Ollama Service    - ChromaDB Service               │  │
│  │  - Embedding Service - Firebase Auth                  │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│    MySQL     │  │  ChromaDB   │  │   Ollama    │
│   Database   │  │   (Vector   │  │  (Llama 3.1)│
│              │  │    Store)   │  │             │
└──────────────┘  └─────────────┘  └─────────────┘
```

## Component Details

### 1. API Layer (FastAPI)

**Responsibilities:**
- Handle HTTP requests/responses
- Authentication via Firebase tokens
- Request validation with Pydantic
- CORS management
- Background task scheduling

**Key Files:**
- `app/api/auth.py` - Authentication endpoints
- `app/api/documents.py` - Document management
- `app/api/query.py` - Query processing
- `app/api/logs.py` - System logs

### 2. Orchestrator Layer

**Responsibilities:**
- Coordinate multi-agent workflows
- Manage thread pool for parallel processing
- Handle document processing pipeline
- Manage query processing pipeline

**Key Files:**
- `app/orchestrator/orchestrator.py` - Main orchestration logic
- `app/orchestrator/thread_manager.py` - Thread pool management

**Workflow:**
```
Document Processing:
1. Parse document → 2. Generate embeddings → 3. Store in ChromaDB

Query Processing:
1. Embed query → 2. Retrieve context → 3. Reason → 4. Decide
```

### 3. Agent Layer

#### Parsing Agent
- **Purpose:** Clean and chunk documents
- **Input:** Raw text
- **Output:** List of text chunks
- **Processing:** Regex cleaning, word-based chunking with overlap

#### Embedding Agent
- **Purpose:** Generate vector embeddings
- **Input:** Text chunks
- **Output:** Vector embeddings
- **Model:** sentence-transformers (all-MiniLM-L6-v2)

#### Reasoning Agent
- **Purpose:** Generate contextual responses
- **Input:** Query + context documents
- **Output:** Natural language response
- **Model:** Llama 3.1 via Ollama

#### Action Agent
- **Purpose:** Make decisions and suggest actions
- **Input:** Query + reasoning output
- **Output:** Structured decision (JSON)
- **Model:** Llama 3.1 via Ollama

### 4. Services Layer

#### Ollama Service
- REST API client for local Ollama server
- Streaming support
- Retry mechanism
- Timeout handling

#### ChromaDB Service
- Vector storage and retrieval
- Organization-based collections
- Persistent storage
- Similarity search

#### Embedding Service
- Sentence transformer wrapper
- Batch processing
- CPU-optimized

#### Firebase Auth
- Token verification
- User management
- Role-based access

### 5. Data Layer

#### MySQL Database

**Tables:**
- `users` - User accounts and roles
- `documents` - Document metadata
- `agent_logs` - Agent execution logs
- `query_history` - User queries
- `decision_outputs` - AI decisions

**Relationships:**
```
users (1) ──→ (N) documents
users (1) ──→ (N) query_history
documents (1) ──→ (N) agent_logs
query_history (1) ──→ (N) decision_outputs
```

#### ChromaDB

**Structure:**
- Collection per organization: `org_{organization_id}`
- Each document chunk stored with:
  - Text content
  - Vector embedding
  - Metadata (document_id, chunk_index, organization_id)

## Data Flow

### Document Upload Flow

```
1. Client uploads file
   ↓
2. API validates and saves file
   ↓
3. Create document record (status: processing)
   ↓
4. Background task starts
   ↓
5. Orchestrator → Parsing Agent (chunks text)
   ↓
6. Orchestrator → Embedding Agent (generates vectors)
   ↓
7. Orchestrator → ChromaDB (stores vectors)
   ↓
8. Update document record (status: completed)
```

### Query Processing Flow

```
1. Client sends query
   ↓
2. API validates request
   ↓
3. Orchestrator → Embedding Service (embed query)
   ↓
4. Orchestrator → ChromaDB (retrieve similar chunks)
   ↓
5. Orchestrator → Reasoning Agent (generate response)
   ↓
6. Orchestrator → Action Agent (make decision)
   ↓
7. Save to query_history and decision_outputs
   ↓
8. Return response to client
```

## Threading Model

### CPU Core Detection
```python
cpu_count = multiprocessing.cpu_count()
max_workers = min(settings.MAX_WORKERS, cpu_count)
```

### Thread Pool Usage
- Document chunk processing
- Batch embedding generation
- Parallel API calls (future enhancement)

### Optimization for AMD Ryzen 7 7000 Series
- Detects available cores (typically 8-16)
- Configurable worker limit
- Efficient task distribution

## Security Architecture

### Authentication Flow
```
1. User logs in via Firebase (client-side)
   ↓
2. Client receives ID token
   ↓
3. Client sends token in Authorization header
   ↓
4. Backend verifies token with Firebase Admin SDK
   ↓
5. Extract user info and proceed
```

### Authorization
- Role-based access control (Admin, Employee)
- Organization-based data isolation
- Document access restricted to organization

### Data Security
- No credentials in code
- Environment-based configuration
- Firebase credentials in separate file
- CORS configured for specific origins (production)

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Shared MySQL database
- Shared ChromaDB storage
- Load balancer distribution

### Vertical Scaling
- Increase MAX_WORKERS
- More RAM for embeddings
- Faster CPU for Ollama
- SSD for ChromaDB

### Bottlenecks
1. **Ollama inference** - CPU-bound, consider GPU
2. **Embedding generation** - CPU-bound, batch processing helps
3. **ChromaDB queries** - I/O-bound, use SSD
4. **MySQL connections** - Use connection pooling

## Performance Metrics

### Logging
- Agent execution time
- API response time
- Document processing time
- Query processing time

### Monitoring Points
- `/health` endpoint
- Agent logs table
- Application logs
- Database query performance

## Future Enhancements

1. **GPU Support** - Ollama with CUDA
2. **Caching** - Redis for frequent queries
3. **Streaming** - WebSocket for real-time responses
4. **Multi-modal** - Image and PDF processing
5. **Advanced RAG** - Hybrid search, reranking
6. **Analytics** - Usage dashboards
7. **API Rate Limiting** - Prevent abuse
8. **Model Fine-tuning** - Domain-specific models

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API | FastAPI | REST API framework |
| Auth | Firebase Admin SDK | Authentication |
| Database | MySQL + SQLAlchemy | Relational data |
| Vector DB | ChromaDB | Embeddings storage |
| LLM | Ollama + Llama 3.1 | Text generation |
| Embeddings | sentence-transformers | Vector generation |
| Threading | concurrent.futures | Parallel processing |
| Server | Uvicorn | ASGI server |
| Containerization | Docker | Deployment |

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | AMD Ryzen 7 7000 series |
| RAM | 16 GB | 32 GB |
| Storage | 20 GB | 50 GB SSD |
| Network | 100 Mbps | 1 Gbps LAN |

## Development Principles

1. **Modularity** - Separate concerns, easy to test
2. **Async-first** - Non-blocking operations
3. **Type Safety** - Pydantic models, type hints
4. **Error Handling** - Graceful degradation
5. **Logging** - Comprehensive tracking
6. **Configuration** - Environment-based
7. **Documentation** - Code and API docs
