from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth, credentials, initialize_app
from app.config.settings import get_settings
import os

settings = get_settings()

# Initialize Firebase Admin
if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    initialize_app(cred)

security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials) -> dict:
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = None):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    decoded_token = await verify_firebase_token(credentials)
    return decoded_token
