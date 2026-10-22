import logging
from typing import List, Dict, Any, Optional
from app.infrastructure.vector_store import vector_db

logger = logging.getLogger("MemoryService")

class MemoryService:
    """
    PHASE 4 Memory & Learning Service.
    Handles semantic retrieval of historical incidents to inform Agent planning.
    """
    async def index_incident(self, incident: Dict[str, Any]):
        """
        Store a completed incident into the long-term vector memory.
        """
        content = f"{incident['title']}: {incident['description']} -> RESOLUTION: {incident['resolution_text']}"
        metadata = {
            "id": incident["id"],
            "tenant_id": incident.get("tenant_id"),
            "category": incident.get("ai_category"),
            "priority": incident.get("priority"),
            "outcome": "Success" # Future: determine via feedback
        }
        vector_db.add(content, metadata)
        logger.info(f"Memory indexed for incident {incident['id']}")

    async def retrieve_precedents(self, description: str, tenant_id: str, k: int = 2) -> List[Dict[str, Any]]:
        """
        Search for past incidents that match the current semantic context.
        """
        logger.info(f"Consulting Memory Vault for: {description[:50]}...")
        # Query the vector store
        results = vector_db.query(description, k=k)
        
        # Filter by Tenant (PHASE 1 Requirement: Strict Isolation)
        tenant_results = [r for r in results if r.get("tenant_id") == tenant_id]
        
        return tenant_results

# Singleton Memory Service
memory_service = MemoryService()
