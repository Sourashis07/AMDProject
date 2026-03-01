from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.services.embedding_service import embedding_service

class EmbeddingAgent(BaseAgent):
    def __init__(self):
        super().__init__("embedding")
        self.embedding_service = embedding_service
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        chunks = input_data.get("chunks", [])
        
        if not chunks:
            return {"embeddings": [], "count": 0}
        
        # Generate embeddings for all chunks
        embeddings = self.embedding_service.embed_batch(chunks)
        
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0
        }

embedding_agent = EmbeddingAgent()
