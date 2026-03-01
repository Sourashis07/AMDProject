"""
Example script demonstrating document processing pipeline
"""
import asyncio
from app.orchestrator.orchestrator import orchestrator
from app.config.database import SessionLocal
from app.models.database_models import User, Document

async def process_example_document():
    """Example of processing a document"""
    db = SessionLocal()
    
    try:
        # Example document text
        sample_text = """
        Company Policy Document
        
        Our company values integrity, innovation, and collaboration.
        All employees must adhere to the code of conduct.
        Working hours are from 9 AM to 5 PM, Monday through Friday.
        Remote work is allowed up to 3 days per week with manager approval.
        Annual leave entitlement is 20 days per year.
        """
        
        # Create a test user if not exists
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                firebase_uid="test_uid",
                email="test@example.com",
                role="employee",
                organization_id="org_test"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create document record
        document = Document(
            user_id=user.id,
            organization_id=user.organization_id,
            filename="example_policy.txt",
            file_path="/tmp/example_policy.txt",
            file_type="text/plain",
            file_size=len(sample_text),
            status="processing"
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Process document
        result = await orchestrator.process_document(
            document_id=document.id,
            text=sample_text,
            organization_id=user.organization_id,
            db=db
        )
        
        print(f"Document processed successfully!")
        print(f"Document ID: {result['document_id']}")
        print(f"Chunks created: {result['chunks_processed']}")
        print(f"Status: {result['status']}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

async def query_example():
    """Example of querying documents"""
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("Please run process_example_document first")
            return
        
        # Query the documents
        result = await orchestrator.process_query(
            query_text="What are the working hours?",
            organization_id=user.organization_id,
            user_id=user.id,
            db=db
        )
        
        print(f"\nQuery processed successfully!")
        print(f"Query ID: {result['query_id']}")
        print(f"Response: {result['response_text']}")
        print(f"Context documents: {len(result['context_documents'])}")
        print(f"Decision: {result['decision']}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Document Processing Example ===\n")
    asyncio.run(process_example_document())
    
    print("\n=== Query Example ===\n")
    asyncio.run(query_example())
