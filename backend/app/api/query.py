from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.database_models import User, QueryHistory, Document
from app.models.schemas import QueryRequest, QueryResponse
from app.models.document_query_schema import DocumentQueryRequest
from app.middleware.auth import get_current_user, security
from app.orchestrator.orchestrator import orchestrator
from app.services.chroma_service import chroma_service
from app.services.embedding_service import embedding_service
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/query", tags=["Query"])

@router.post("/", response_model=QueryResponse)
async def process_query(
    query_data: QueryRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Process a query using RAG pipeline"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Process query through orchestrator
    result = await orchestrator.process_query(
        query_text=query_data.query_text,
        organization_id=user.organization_id,
        user_id=user.id,
        db=db
    )
    
    return QueryResponse(
        query_id=result["query_id"],
        response_text=result["response_text"],
        context_documents=result["context_documents"],
        decisions=[result["decision"]]
    )

@router.post("/document", response_model=QueryResponse)
async def process_document_query(
    query_data: DocumentQueryRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Process a query for a specific document"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify document belongs to user's organization
    document = db.query(Document).filter(
        Document.id == query_data.document_id,
        Document.organization_id == user.organization_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Generate query embedding
    query_embedding = embedding_service.embed_text(query_data.query_text)
    
    # Retrieve only from this specific document
    results = chroma_service.query_documents(
        organization_id=user.organization_id,
        query_embeddings=[query_embedding],
        n_results=10
    )
    
    # Filter results to only include chunks from this document
    all_docs = results.get("documents", [[]])[0]
    all_metadatas = results.get("metadatas", [[]])[0]
    
    filtered_docs = []
    filtered_metadatas = []
    
    for doc, meta in zip(all_docs, all_metadatas):
        if meta.get("document_id") == query_data.document_id:
            filtered_docs.append(doc)
            filtered_metadatas.append(meta)
    
    if not filtered_docs:
        raise HTTPException(status_code=404, detail="No content found in this document")
    
    # Process through reasoning and action agents
    from app.agents.reasoning_agent import reasoning_agent
    from app.agents.action_agent import action_agent
    from app.models.database_models import QueryHistory, DecisionOutput
    from datetime import datetime
    
    # Build context instruction based on answer mode
    mode_instructions = {
        'strict': 'Answer ONLY using information from the provided context. If the answer is not in the context, say so.',
        'balanced': 'Answer primarily using the provided context, but you may add brief clarifications from general knowledge if needed.',
        'creative': 'Use the provided context as a foundation, and supplement with relevant general knowledge to provide a comprehensive answer.'
    }
    mode_instruction = mode_instructions.get(query_data.answer_mode, mode_instructions['balanced'])
    
    reasoning_result = await reasoning_agent.run(
        {
            "query": f"{query_data.query_text}\n\nInstructions: {mode_instruction} Keep response under {query_data.word_limit} words.",
            "context": filtered_docs,
            "action": "reason"
        },
        db=db
    )
    response_text = reasoning_result["response"]
    
    action_result = await action_agent.run(
        {
            "query": query_data.query_text,
            "reasoning_output": response_text,
            "action": "decide"
        },
        db=db
    )
    
    # Save to database
    query_history = QueryHistory(
        user_id=user.id,
        organization_id=user.organization_id,
        query_text=query_data.query_text,
        response_text=response_text,
        context_documents=filtered_metadatas
    )
    db.add(query_history)
    db.flush()
    
    decision = DecisionOutput(
        query_id=query_history.id,
        decision_type=action_result.get("decision_type", "informational"),
        reasoning=action_result.get("reasoning_summary", ""),
        confidence_score=action_result.get("confidence_score", 0),
        suggested_actions=action_result.get("suggested_actions", []),
        decision_metadata=action_result
    )
    db.add(decision)
    db.commit()
    
    return QueryResponse(
        query_id=query_history.id,
        response_text=response_text,
        context_documents=filtered_metadatas,
        decisions=[action_result]
    )

@router.get("/history", response_model=List[dict])
async def get_query_history(
    limit: int = 10,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get query history for current user"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == user.id
    ).order_by(QueryHistory.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": q.id,
            "query_text": q.query_text,
            "response_text": q.response_text,
            "created_at": q.created_at
        }
        for q in queries
    ]
