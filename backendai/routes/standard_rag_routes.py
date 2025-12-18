from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import logging
import json

from controller.standard_rag_controller import standard_rag_controller

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None 
    user_plan: Optional[str] = None # Added user_plan
    chatbot_id: Optional[str] = None
    conversation_id: Optional[str] = None
    prompt: Optional[str] = None

@router.post("/standard/set_user_assistant")
async def set_user_assistant(request: ChatRequest):
    """
    Creates/Updates OpenAI Assistant with Vector Store containing 
    data from the 'automations' table for this chatbot.
    """
    chatbot_id = request.chatbot_id
    if not chatbot_id:
        raise HTTPException(status_code=400, detail="chatbot_id is required")

    try:
        # Changed to Local Ingestion
        success = await standard_rag_controller.ingest_to_vector_db(chatbot_id)
        logging.info(f"Local RAG Ingestion for {chatbot_id}: {success}")
        return {"message": "Knowledge Base updated successfully (Local Vector DB)"}
    except Exception as e:
        logging.error(f"Error setting assistant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/standard/chat")
async def chat_standard(request: ChatRequest):
    """
    Chats with the OpenAI Assistant using Threads (with Vector Store context).
    Uses 'bot_conversations' for history storage.
    """
    user_id = request.user_id
    user_email = request.user_email 
    user_plan = request.user_plan # Extract plan
    chatbot_id = request.chatbot_id
    conversation_id = request.conversation_id
    prompt = request.prompt

    if not chatbot_id or not prompt:
         raise HTTPException(status_code=400, detail="chatbot_id and prompt are required")

    return StreamingResponse(
        standard_rag_controller.chat_stream(chatbot_id, user_id, prompt, conversation_id, user_email, user_plan), # Pass plan
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
