from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.config.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    organization_id = Column(String(64), nullable=False, index=True)
    last_ip = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    documents = relationship("Document", back_populates="user")
    queries = relationship("QueryHistory", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(String(64), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    status = Column(String(50), default="pending")
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="documents")
    agent_logs = relationship("AgentLog", back_populates="document")

class AgentLog(Base):
    __tablename__ = "agent_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    agent_type = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    status = Column(String(50), default="success")
    error_message = Column(Text, nullable=True)
    execution_time = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="agent_logs")

class QueryHistory(Base):
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(String(64), nullable=False, index=True)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    context_documents = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="queries")
    decisions = relationship("DecisionOutput", back_populates="query")

class DecisionOutput(Base):
    __tablename__ = "decision_outputs"
    
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("query_history.id"), nullable=False)
    decision_type = Column(String(100), nullable=False)
    reasoning = Column(Text, nullable=True)
    confidence_score = Column(Integer, nullable=True)
    suggested_actions = Column(JSON, nullable=True)
    decision_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    query = relationship("QueryHistory", back_populates="decisions")
