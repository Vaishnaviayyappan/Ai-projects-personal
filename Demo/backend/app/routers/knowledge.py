import io

from docx import Document as DocxDocument
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.agent import rag
from app.database import get_db
from app.models import Avatar, KnowledgeSource, User
from app.schemas import KnowledgeSourceOut, KnowledgeTextUpload
from app.security import get_current_user

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


def _extract_text(filename: str, raw: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(raw))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if lower.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(raw))
        return "\n".join(p.text for p in doc.paragraphs)
    return raw.decode("utf-8", errors="ignore")


def _ingest(db: Session, org_id: str, avatar_id: str | None, name: str, source_type: str, text: str) -> KnowledgeSource:
    source = KnowledgeSource(
        organization_id=org_id, avatar_id=avatar_id, name=name, source_type=source_type,
        status="processing", raw_text=text,
    )
    db.add(source)
    db.flush()
    _index(db, source)
    return source


def _index(db: Session, source: KnowledgeSource) -> None:
    try:
        chunks = rag.chunk_text(source.raw_text or "")
        rag.index_chunks(source.organization_id, source.avatar_id, source.id, source.name, chunks)
        source.status = "ready"
        source.chunk_count = len(chunks)
    except RuntimeError:
        source.status = "failed"
        source.chunk_count = 0
    db.commit()
    db.refresh(source)


@router.post("/upload-file", response_model=KnowledgeSourceOut)
async def upload_file(
    avatar_id: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if avatar_id:
        avatar = db.query(Avatar).filter(Avatar.id == avatar_id, Avatar.organization_id == user.organization_id).first()
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")

    raw = await file.read()
    text = _extract_text(file.filename, raw)
    source_type = "pdf" if file.filename.lower().endswith(".pdf") else "docx" if file.filename.lower().endswith(".docx") else "text"
    return _ingest(db, user.organization_id, avatar_id, file.filename, source_type, text)


@router.post("/upload-text", response_model=KnowledgeSourceOut)
def upload_text(payload: KnowledgeTextUpload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.avatar_id:
        avatar = db.query(Avatar).filter(Avatar.id == payload.avatar_id, Avatar.organization_id == user.organization_id).first()
        if not avatar:
            raise HTTPException(status_code=404, detail="Avatar not found")
    return _ingest(db, user.organization_id, payload.avatar_id, payload.name, "faq", payload.content)


@router.get("", response_model=list[KnowledgeSourceOut])
def list_sources(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(KnowledgeSource).filter(KnowledgeSource.organization_id == user.organization_id).all()


@router.post("/{source_id}/reindex", response_model=KnowledgeSourceOut)
def reindex_source(source_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    source = db.query(KnowledgeSource).filter(
        KnowledgeSource.id == source_id, KnowledgeSource.organization_id == user.organization_id
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    rag.delete_source(source_id)
    _index(db, source)
    return source


@router.delete("/{source_id}")
def delete_source(source_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    source = db.query(KnowledgeSource).filter(
        KnowledgeSource.id == source_id, KnowledgeSource.organization_id == user.organization_id
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    rag.delete_source(source_id)
    db.delete(source)
    db.commit()
    return {"status": "deleted"}
