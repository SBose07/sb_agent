from fastapi import APIRouter, HTTPException
from typing import List

from ..models.document import Document, DocumentCreate, DocumentUpdate
from ..services.document_service import document_service


router = APIRouter(tags=["documents"])


@router.get("/", response_model=List[Document])
async def get_documents():
    """Get all documents."""
    return document_service.get_all()


@router.get("/{document_id}", response_model=Document)
async def get_document(document_id: str):
    """Get a specific document by ID."""
    document = document_service.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/", response_model=Document)
async def create_document(data: DocumentCreate):
    """Create a new document."""
    return document_service.create(data)


@router.put("/{document_id}", response_model=Document)
async def update_document(document_id: str, data: DocumentUpdate):
    """Update an existing document."""
    document = document_service.update(document_id, data)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document."""
    success = document_service.delete(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "id": document_id}
