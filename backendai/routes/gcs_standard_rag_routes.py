"""
GCS Standard RAG Routes.

These routes provide the same endpoints as standard_rag_routes.py but use
Google Cloud Services (Gemini) instead of OpenAI.

Endpoints:
- POST /gcs/standard/chat - Chat using Gemini (streaming)

For free trial users, the frontend should use these endpoints instead of
the OpenAI-based /standard/chat endpoint.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import logging

from controller.gcs_standard_rag_controller import gcs_standard_rag_controller

router = APIRouter(prefix="/gcs")


class ChatRequest(BaseModel):
    """Request model for chat endpoint - SAME AS standard_rag_routes.py"""
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_plan: Optional[str] = None
    chatbot_id: Optional[str] = None
    conversation_id: Optional[str] = None
    prompt: Optional[str] = None


@router.post("/standard/chat")
async def gcs_chat_standard(request: ChatRequest):
    """
    Chat using Gemini (for free trial users).
    
    This endpoint provides the same functionality as /standard/chat but uses
    Google Cloud Services AI instead of OpenAI.
    
    Features:
    - Streaming responses (SSE)
    - Vector search context (uses OpenAI embeddings - shared)
    - Industry-specific prompts
    - Conversation history
    - Progressive form collection
    - Function calling (lead capture, handoff)
    
    Args:
        request: ChatRequest with chatbot_id, prompt, and optional user info
        
    Returns:
        StreamingResponse with SSE events:
        - {"token": "..."} - Partial response text
        - {"event": "thread_created", "thread_id": "..."} - New conversation created
        - {"event": "end"} - Stream complete
        - {"error": "..."} - Error occurred
    """
    if not request.chatbot_id:
        raise HTTPException(status_code=400, detail="chatbot_id is required")
    
    if not request.prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    
    logging.info(f"[GCS] Chat request for chatbot: {request.chatbot_id}")
    
    return StreamingResponse(
        gcs_standard_rag_controller.chat_stream(
            request.chatbot_id,
            request.user_id,
            request.prompt,
            request.conversation_id,
            request.user_email,
            request.user_plan
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/health")
async def gcs_health_check():
    """Health check for GCS routes."""
    return {"status": "ok", "service": "gcs-standard-rag"}
