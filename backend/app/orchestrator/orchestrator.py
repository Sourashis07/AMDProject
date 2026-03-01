from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.parsing_agent import parsing_agent
from app.agents.embedding_agent import embedding_agent
from app.agents.reasoning_agent import reasoning_agent
from app.agents.action_agent import action_agent
from app.services.chroma_service import chroma_service
from app.services.embedding_service import embedding_service
from app.orchestrator.thread_manager import thread_manager
from app.utils.logger import get_logger
from app.models.database_models import Document, QueryHistory, DecisionOutput
from datetime import datetime

logger = get_logger(__name__)

class Orchestrator:
    def __init__(self):
        self.parsing_agent = parsing_agent
        self.embedding_agent = embedding_agent
        self.reasoning_agent = reasoning_agent
        self.action_agent = action_agent
        self.chroma_service = chroma_service
        self.thread_manager = thread_manager
    
    async def process_document(
        self,
        document_id: int,
        text: str,
        organization_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """Process a document through the agent pipeline"""
        logger.info(f"Processing document {document_id}")
        
        # Step 1: Parse document
        parse_result = await self.parsing_agent.run(
            {"text": text, "action": "parse"},
            db=db,
            document_id=document_id
        )
        chunks = parse_result["chunks"]
        
        # Step 2: Generate embeddings
        embed_result = await self.embedding_agent.run(
            {"chunks": chunks, "action": "embed"},
            db=db,
            document_id=document_id
        )
        embeddings = embed_result["embeddings"]
        
        # Step 3: Store in ChromaDB
        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {"document_id": document_id, "chunk_index": i, "organization_id": organization_id}
            for i in range(len(chunks))
        ]
        
        self.chroma_service.add_documents(
            organization_id=organization_id,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
        # Update document status
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "completed"
            doc.chunk_count = len(chunks)
            doc.processed_at = datetime.utcnow()
            db.commit()
        
        return {
            "document_id": document_id,
            "chunks_processed": len(chunks),
            "status": "completed"
        }
    
    async def process_query(
        self,
        query_text: str,
        organization_id: str,
        user_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Process a user query through the agent pipeline"""
        logger.info(f"Processing query for user {user_id}")
        
        # Step 1: Generate query embedding
        query_embedding = embedding_service.embed_text(query_text)
        
        # Step 2: Retrieve relevant documents
        results = self.chroma_service.query_documents(
            organization_id=organization_id,
            query_embeddings=[query_embedding],
            n_results=5
        )
        
        context_docs = results.get("documents", [[]])[0]
        context_metadatas = results.get("metadatas", [[]])[0]
        
        # Step 3: Reasoning
        reasoning_result = await self.reasoning_agent.run(
            {"query": query_text, "context": context_docs, "action": "reason"},
            db=db
        )
        response_text = reasoning_result["response"]
        
        # Step 4: Action/Decision
        action_result = await self.action_agent.run(
            {
                "query": query_text,
                "reasoning_output": response_text,
                "action": "decide"
            },
            db=db
        )
        
        # Save to database
        query_history = QueryHistory(
            user_id=user_id,
            organization_id=organization_id,
            query_text=query_text,
            response_text=response_text,
            context_documents=context_metadatas
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
        
        return {
            "query_id": query_history.id,
            "response_text": response_text,
            "context_documents": context_metadatas,
            "decision": action_result
        }

orchestrator = Orchestrator()
