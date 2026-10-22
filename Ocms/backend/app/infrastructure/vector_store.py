import logging
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger("VectorStore")

class SimpleVectorStore:
    """
    Simulates a Vector Database (like ChromaDB or Weaviate).
    Stores incident embeddings (simulated) for semantic retrieval.
    """
    def __init__(self):
        self.indices: List[np.ndarray] = []
        self.metadata: List[Dict[str, Any]] = []

    def _get_embedding(self, text: str) -> np.ndarray:
        # Mock embedding logic: simple hash-based vector for stable similarity
        # In production, this would use OpenAI embeddings or SentenceTransformers
        return np.array([ord(c) % 100 for c in text[:32]] + [0]*(32 - len(text)))

    def add(self, text: str, metadata: Dict[str, Any]):
        embedding = self._get_embedding(text)
        self.indices.append(embedding)
        self.metadata.append(metadata)
        logger.info(f"Vector indexed for: {metadata.get('id')}")

    def query(self, text: str, k: int = 3) -> List[Dict[str, Any]]:
        if not self.indices:
            return []
        
        query_vec = self._get_embedding(text)
        
        # Simple cosine similarity (mocked via dot product)
        similarities = []
        for i, doc_vec in enumerate(self.indices):
            # Pad doc_vec if different size (shouldn't happen with our mock)
            sim = np.dot(query_vec, doc_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(doc_vec) + 1e-9)
            similarities.append((sim, self.metadata[i]))
            
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in similarities[:k]]

# Persistent Vector Instance
vector_db = SimpleVectorStore()
