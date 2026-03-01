# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

All endpoints (except `/` and `/health`) require Firebase ID token in Authorization header:
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

## Endpoints

### Health Check

#### GET /
Get API status
```bash
curl http://localhost:8000/
```

Response:
```json
{
  "message": "Enterprise Agentic AI System",
  "status": "running",
  "version": "1.0.0"
}
```

#### GET /health
Health check endpoint
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy"
}
```

### Authentication

#### POST /auth/register
Register a new user

Request:
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

Response:
```json
{
  "id": 1,
  "firebase_uid": "user123",
  "email": "user@example.com",
  "role": "employee",
  "organization_id": "org_001",
  "created_at": "2024-01-01T00:00:00"
}
```

#### GET /auth/me
Get current user information

Request:
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

### Documents

#### POST /documents/upload
Upload a document for processing

Request:
```bash
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -F "file=@document.txt"
```

Response:
```json
{
  "id": 1,
  "filename": "document.txt",
  "status": "processing",
  "chunk_count": 0,
  "created_at": "2024-01-01T00:00:00",
  "processed_at": null
}
```

#### GET /documents/
List all documents for organization

Request:
```bash
curl http://localhost:8000/documents/ \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

Response:
```json
[
  {
    "id": 1,
    "filename": "document.txt",
    "status": "completed",
    "chunk_count": 15,
    "created_at": "2024-01-01T00:00:00",
    "processed_at": "2024-01-01T00:01:00"
  }
]
```

#### GET /documents/{document_id}
Get specific document details

Request:
```bash
curl http://localhost:8000/documents/1 \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

### Query

#### POST /query/
Process a RAG query

Request:
```bash
curl -X POST http://localhost:8000/query/ \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "What is the company policy on remote work?",
    "organization_id": "org_001"
  }'
```

Response:
```json
{
  "query_id": 1,
  "response_text": "According to the company policy...",
  "context_documents": [
    {
      "document_id": 1,
      "chunk_index": 3,
      "organization_id": "org_001"
    }
  ],
  "decisions": [
    {
      "decision_type": "informational",
      "confidence_score": 85,
      "suggested_actions": ["Review policy document"],
      "reasoning_summary": "The query is asking about..."
    }
  ]
}
```

#### GET /query/history
Get query history

Request:
```bash
curl "http://localhost:8000/query/history?limit=10" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

Response:
```json
[
  {
    "id": 1,
    "query_text": "What is the company policy?",
    "response_text": "The company policy states...",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

### Logs

#### GET /logs/agents
Get agent execution logs

Request:
```bash
curl "http://localhost:8000/logs/agents?limit=50&agent_type=parsing" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

Response:
```json
[
  {
    "id": 1,
    "agent_type": "parsing",
    "action": "parse",
    "status": "success",
    "execution_time": 150,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## WebSocket Support

Not currently implemented. Future versions may include WebSocket support for streaming responses.
