from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
import re

class ParsingAgent(BaseAgent):
    def __init__(self):
        super().__init__("parsing")
    
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        text = input_data.get("text", "")
        chunk_size = input_data.get("chunk_size", 500)
        overlap = input_data.get("overlap", 50)
        
        # Clean text
        cleaned_text = self._clean_text(text)
        
        # Split into chunks
        chunks = self._chunk_text(cleaned_text, chunk_size, overlap)
        
        return {
            "chunks": chunks,
            "chunk_count": len(chunks),
            "original_length": len(text),
            "cleaned_length": len(cleaned_text)
        }
    
    def _clean_text(self, text: str) -> str:
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\-\(\)]', '', text)
        return text.strip()
    
    def _chunk_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks

parsing_agent = ParsingAgent()
