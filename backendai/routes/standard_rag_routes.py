from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import logging
import json
import asyncio

from controller.standard_rag_controller import standard_rag_controller

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None 
    user_plan: Optional[str] = None # Added user_plan
    chatbot_id: Optional[str] = None
    conversation_id: Optional[str] = None
    prompt: Optional[str] = None
    webhook_url: Optional[str] = None  # For async training progress updates

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

# Alias for rtserver compatibility - now async
@router.post("/api/ingest")
async def ingest_training_data(request: ChatRequest):
    """
    Async training endpoint - starts background training and returns immediately
    """
    print("\n" + "="*80)
    print("🎯 /api/ingest endpoint hit!")
    print(f"   chatbot_id: {request.chatbot_id}")
    print(f"   webhook_url: {request.webhook_url}")
    print("="*80 + "\n")
    logging.info(f"🎯 /api/ingest called with chatbot_id={request.chatbot_id}, webhook_url={request.webhook_url}")
    
    chatbot_id = request.chatbot_id
    webhook_url = request.webhook_url
    
    if not chatbot_id:
        raise HTTPException(status_code=400, detail="chatbot_id is required")
    
    try:
        # Import async training helper
        print("📦 Importing start_training_job")
        logging.info("📦 Importing start_training_job")
        from controller.async_training import start_training_job
        print("✅ Import successful")
        print(f"▶️  Calling start_training_job({chatbot_id}, {webhook_url})")
        logging.info(f"▶️  Calling start_training_job({chatbot_id}, {webhook_url})")
        result = await start_training_job(chatbot_id, webhook_url)
        print(f"✅ Got result: {result}")
        logging.info(f"✅ start_training_job returned: {result}")
        return result
    except Exception as e:
        logging.error(f"❌ Error starting training job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class DeleteSourceRequest(BaseModel):
    chatbot_id: str
    source: str

@router.post("/api/delete_source")
async def delete_source(request: DeleteSourceRequest):
    """
    Deletes vectors associated with a specific source (URL, File Name, Article ID)
    """
    chatbot_id = request.chatbot_id
    source = request.source
    
    if not chatbot_id or not source:
        raise HTTPException(status_code=400, detail="chatbot_id and source are required")
        
    try:
        logging.info(f"🗑️ Deleting source '{source}' for chatbot {chatbot_id}")
        # Import directly to avoid circular dependency
        from DB.postgresDB import delete_specific_chunks
        
        await asyncio.to_thread(delete_specific_chunks, chatbot_id, source)
        
        return {"status": "success", "message": f"Source '{source}' deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting source: {e}")
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
