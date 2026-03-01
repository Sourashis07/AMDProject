from typing import Dict, Any
from app.agents.base_agent import BaseAgent
from app.services.ollama_service import ollama_service
import json

class ReasoningAgent(BaseAgent):
    def __init__(self):
        super().__init__("reasoning")
        self.ollama_service = ollama_service
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        query = input_data.get("query", "")
        context = input_data.get("context", [])
        
        # Build prompt with context
        context_text = "\n\n".join([f"Document {i+1}:\n{doc}" for i, doc in enumerate(context)])
        
        system_prompt = """You are an AI assistant analyzing enterprise documents. 
Provide clear, concise answers based on the given context. 
If the context doesn't contain relevant information, say so."""
        
        prompt = f"""Context:
{context_text}

Question: {query}

Provide a detailed answer based on the context above."""
        
        # Generate response
        response = await self.ollama_service.generate(
            prompt=prompt,
            system=system_prompt,
            temperature=0.7
        )
        
        return {
            "response": response,
            "query": query,
            "context_count": len(context)
        }

reasoning_agent = ReasoningAgent()
