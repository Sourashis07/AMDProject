from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import init_db
from app.config.settings import get_settings
from app.api import auth, documents, query, logs
from app.utils.logger import get_logger
import uvicorn

settings = get_settings()
logger = get_logger(__name__)

app = FastAPI(
    title="Enterprise Agentic AI System",
    description="Local AI system with RAG capabilities",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(query.router)
app.include_router(logs.router)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Enterprise Agentic AI System")
    init_db()
    logger.info("Database initialized")

@app.get("/")
async def root():
    return {
        "message": "Enterprise Agentic AI System",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
