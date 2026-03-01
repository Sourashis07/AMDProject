from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.database_models import User
from app.models.schemas import UserCreate, UserResponse
from app.middleware.auth import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Register a new user after Firebase authentication"""
    # Verify token
    token_data = await get_current_user(None, credentials)
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.firebase_uid == user_data.firebase_uid).first()
    if existing_user:
        return existing_user
    
    # Create new user
    new_user = User(
        firebase_uid=user_data.firebase_uid,
        email=user_data.email,
        role=user_data.role,
        organization_id=user_data.organization_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user information"""
    token_data = await get_current_user(None, credentials)
    
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
