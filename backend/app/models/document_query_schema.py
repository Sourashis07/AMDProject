from pydantic import BaseModel
from typing import Optional

class DocumentQueryRequest(BaseModel):
    query_text: str
    document_id: int
    word_limit: Optional[int] = 200
    answer_mode: Optional[str] = 'balanced'
    model: Optional[str] = 'llama3.1:8b'
