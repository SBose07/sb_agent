import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services.llm_service import llm_service
from ..services.document_service import document_service


router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    prompt: str


@router.post("/stream/{document_id}")
async def stream_edit(document_id: str, request: ChatRequest):
    """
    Stream LLM response with document edit operations.
    
    Uses Server-Sent Events to stream:
    - 'token': Streaming text tokens
    - 'thinking': AI processing status
    - 'highlight': Line being edited
    - 'edit': Document edit operation
    - 'done': Completion message
    - 'error': Error message
    """
    # Verify document exists
    document = document_service.get_by_id(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    async def event_generator():
        try:
            async for event in llm_service.process_edit_streaming(
                document_id, 
                request.prompt
            ):
                # Convert event to JSON
                event_data = event.model_dump(exclude_none=True)
                yield f"data: {json.dumps(event_data)}\n\n"
        except Exception as e:
            error_event = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
