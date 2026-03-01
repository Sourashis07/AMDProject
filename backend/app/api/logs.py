from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.database_models import User, AgentLog
from app.models.schemas import AgentLogResponse
from app.middleware.auth import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("/agents", response_model=List[AgentLogResponse])
async def get_agent_logs(
    limit: int = 50,
    agent_type: str = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get agent execution logs"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    query = db.query(AgentLog)
    
    if agent_type:
        query = query.filter(AgentLog.agent_type == agent_type)
    
    logs = query.order_by(AgentLog.created_at.desc()).limit(limit).all()
    
    return logs
