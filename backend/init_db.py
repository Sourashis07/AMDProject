"""
Database initialization and migration script
Run this to create all tables
"""
from app.config.database import engine, Base
from app.models.database_models import User, Document, AgentLog, QueryHistory, DecisionOutput
from app.utils.logger import get_logger

logger = get_logger(__name__)

def init_database():
    """Initialize database tables"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def drop_all_tables():
    """Drop all tables (use with caution)"""
    try:
        logger.warning("Dropping all database tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped")
    except Exception as e:
        logger.error(f"Error dropping tables: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--drop":
        drop_all_tables()
    
    init_database()
    print("Database initialized successfully!")
