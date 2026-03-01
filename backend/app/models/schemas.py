from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class UserCreate(BaseModel):
    firebase_uid: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    organization_id: str

class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    role: UserRole
    organization_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DocumentUpload(BaseModel):
    filename: str
    file_type: str

class DocumentResponse(BaseModel):
    id: int
    filename: str
    status: str
    chunk_count: int
    created_at: datetime
    processed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class QueryRequest(BaseModel):
    query_text: str
    organization_id: str

class QueryResponse(BaseModel):
    query_id: int
    response_text: str
    context_documents: List[Dict[str, Any]]
    decisions: List[Dict[str, Any]]

class AgentLogResponse(BaseModel):
    id: int
    agent_type: str
    action: str
    status: str
    execution_time: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True
