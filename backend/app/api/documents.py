from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.database_models import User, Document
from app.models.schemas import DocumentResponse
from app.middleware.auth import get_current_user, security
from app.orchestrator.orchestrator import orchestrator
from app.services.document_processor import document_processor
from fastapi.security import HTTPAuthorizationCredentials
import os
import uuid

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_document_background(document_id: int, file_path: str, organization_id: str, file_type: str):
    """Background task to process document"""
    from app.config.database import SessionLocal
    from app.utils.logger import get_logger
    logger = get_logger(__name__)
    
    db = SessionLocal()
    try:
        logger.info(f"Processing document {document_id}, type: {file_type}")
        
        # Process file based on type
        text = document_processor.process_file(file_path, file_type)
        
        if not text or len(text.strip()) < 10:
            raise Exception("No text extracted from document")
        
        logger.info(f"Extracted {len(text)} characters from document {document_id}")
        
        await orchestrator.process_document(
            document_id=document_id,
            text=text,
            organization_id=organization_id,
            db=db
        )
        logger.info(f"Successfully processed document {document_id}")
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create document record
    document = Document(
        user_id=user.id,
        organization_id=user.organization_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        status="processing"
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Process in background
    background_tasks.add_task(
        process_document_background,
        document.id,
        file_path,
        user.organization_id,
        file.content_type
    )
    
    return document

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """List all documents for the current user's organization"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    documents = db.query(Document).filter(
        Document.organization_id == user.organization_id
    ).order_by(Document.created_at.desc()).all()
    
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get a specific document"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.organization_id == user.organization_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Delete a document and its associated data"""
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.organization_id == user.organization_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete from ChromaDB
    from app.services.chroma_service import chroma_service
    try:
        chroma_service.delete_document(user.organization_id, document_id)
    except:
        pass
    
    # Delete from database (cascades to related records)
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.get("/view/{document_id}")
async def view_document(
    document_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """View document file"""
    from fastapi.responses import FileResponse
    from fastapi.security import HTTPAuthorizationCredentials
    
    # Create credentials from token
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    token_data = await get_current_user(None, credentials)
    user = db.query(User).filter(User.firebase_uid == token_data["uid"]).first()
    
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.organization_id == user.organization_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(document.file_path, filename=document.filename)
