from dataclasses import dataclass

import chromadb

from app.config import settings
from app.agent.llm import llm_client

_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
_collection = _client.get_or_create_collection(name="knowledge_chunks", metadata={"hnsw:space": "cosine"})


@dataclass
class RetrievedChunk:
    content: str
    source_id: str
    source_name: str
    distance: float

    @property
    def relevance(self) -> float:
        # Collection is configured for cosine distance (range 0-2); convert to a 0-1 similarity.
        return max(0.0, 1.0 - self.distance / 2.0)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def index_chunks(org_id: str, avatar_id: str | None, source_id: str, source_name: str, chunks: list[str]) -> list[str]:
    ids, embeddings, metadatas, documents = [], [], [], []
    for i, chunk in enumerate(chunks):
        vector_id = f"{source_id}-{i}"
        ids.append(vector_id)
        embeddings.append(llm_client.embed(chunk))
        metadatas.append({
            "org_id": org_id,
            "avatar_id": avatar_id or "",
            "source_id": source_id,
            "source_name": source_name,
            "chunk_index": i,
        })
        documents.append(chunk)
    if ids:
        _collection.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    return ids


def delete_source(source_id: str) -> None:
    _collection.delete(where={"source_id": source_id})


def search(org_id: str, avatar_id: str, query: str, top_k: int = 4) -> list[RetrievedChunk]:
    query_embedding = llm_client.embed(query)
    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={
            "$and": [
                {"org_id": {"$eq": org_id}},
                {"$or": [{"avatar_id": {"$eq": avatar_id}}, {"avatar_id": {"$eq": ""}}]},
            ]
        },
    )
    chunks: list[RetrievedChunk] = []
    if not results["ids"] or not results["ids"][0]:
        return chunks
    for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
        chunks.append(RetrievedChunk(content=doc, source_id=meta["source_id"], source_name=meta["source_name"], distance=dist))
    return chunks
