import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any
from app.config.settings import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

class ChromaDBService:
    def __init__(self):
        self.client = chromadb.Client(Settings(
            persist_directory=settings.CHROMA_PERSIST_DIR,
            anonymized_telemetry=False
        ))
        logger.info(f"ChromaDB initialized at {settings.CHROMA_PERSIST_DIR}")
    
    def get_collection(self, organization_id: str):
        collection_name = f"{settings.CHROMA_COLLECTION_PREFIX}{organization_id}"
        try:
            collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"organization_id": organization_id}
            )
            return collection
        except Exception as e:
            logger.error(f"Error getting collection: {e}")
            raise
    
    def add_documents(
        self,
        organization_id: str,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ):
        collection = self.get_collection(organization_id)
        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Added {len(documents)} documents to collection {organization_id}")
    
    def query_documents(
        self,
        organization_id: str,
        query_embeddings: List[List[float]],
        n_results: int = 5
    ) -> Dict[str, Any]:
        collection = self.get_collection(organization_id)
        results = collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results
        )
        return results
    
    def delete_collection(self, organization_id: str):
        collection_name = f"{settings.CHROMA_COLLECTION_PREFIX}{organization_id}"
        self.client.delete_collection(name=collection_name)
        logger.info(f"Deleted collection {collection_name}")
    
    def delete_document(self, organization_id: str, document_id: int):
        collection = self.get_collection(organization_id)
        results = collection.get(where={"document_id": document_id})
        if results['ids']:
            collection.delete(ids=results['ids'])
            logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")

chroma_service = ChromaDBService()
