from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from controller.copilot_controller import copilot
from typing import Optional, Dict, List, Any
import uuid
import json

router = APIRouter(prefix="/copilot", tags=["copilot"])

# Request schemas
class CopilotChatRequest(BaseModel):
    session_id: Optional[str] = None
    prompt: str
    context_data: Optional[Dict[str, Any]] = None

class SessionRequest(BaseModel):
    session_id: str

class ContextData(BaseModel):
    past_emails: Optional[List[Dict[str, Any]]] = None
    past_chats: Optional[List[Dict[str, Any]]] = None
    ticket_info: Optional[Dict[str, Any]] = None

# Endpoint: /chat - Streaming response (updated to stream by default)
@router.post("/chat")
async def chat(payload: CopilotChatRequest):
    """
    Generate a streaming response from the co-pilot
    """
    try:
        # Generate session ID if not provided
        session_id = payload.session_id or str(uuid.uuid4())
        
        def generate():
            try:
                # Send session ID first
                yield f"data: {json.dumps({'session_id': session_id, 'content': '', 'done': False})}\n\n"
                
                # Generate streaming response
                for chunk in copilot.generate_streaming_response(
                    session_id=session_id,
                    prompt=payload.prompt,
                    context_data=payload.context_data
                ):
                    yield chunk
                    
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating streaming response: {str(e)}")

# Endpoint: /chat/stream - Alternative streaming endpoint (same as /chat)
@router.post("/chat/stream")
async def chat_stream(payload: CopilotChatRequest):
    """
    Generate a regular (non-streaming) response from the co-pilot
    """
    try:
        # Generate session ID if not provided
        session_id = payload.session_id or str(uuid.uuid4())
        
        # Generate response
        response = copilot.generate_response(
            session_id=session_id,
            prompt=payload.prompt,
            context_data=payload.context_data
        )
        
        return {
            "status": "success",
            "session_id": session_id,
            "response": response
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
    """
    Generate a streaming response from the co-pilot
    """
    try:
        # Generate session ID if not provided
        session_id = payload.session_id or str(uuid.uuid4())
        
        def generate():
            try:
                # Send session ID first
                yield f"data: {json.dumps({'session_id': session_id, 'content': '', 'done': False})}\n\n"
                
                # Generate streaming response
                for chunk in copilot.generate_streaming_response(
                    session_id=session_id,
                    prompt=payload.prompt,
                    context_data=payload.context_data
                ):
                    yield chunk
                    
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating streaming response: {str(e)}")

# Endpoint: /session/history - Get chat history
@router.post("/session/history")
async def get_session_history(payload: SessionRequest):
    """
    Get chat history for a session
    """
    try:
        history = copilot.get_session_history(payload.session_id)
        
        return {
            "status": "success",
            "session_id": payload.session_id,
            "history": history
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session history: {str(e)}")

# Endpoint: /session/clear - Clear session
@router.post("/session/clear")
async def clear_session(payload: SessionRequest):
    """
    Clear a specific session
    """
    try:
        success = copilot.clear_session(payload.session_id)
        
        return {
            "status": "success",
            "session_id": payload.session_id,
            "cleared": success
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing session: {str(e)}")

# Endpoint: /session/info - Get session info
@router.get("/session/{session_id}/info")
async def get_session_info(session_id: str):
    """
    Get information about a session
    """
    try:
        info = copilot.get_session_info(session_id)
        
        return {
            "status": "success",
            "session_id": session_id,
            "info": info
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting session info: {str(e)}")

# Endpoint: /session/new - Create new session
@router.post("/session/new")
async def create_new_session():
    """
    Create a new session
    """
    try:
        session_id = str(uuid.uuid4())
        copilot.create_session(session_id)
        
        return {
            "status": "success",
            "session_id": session_id,
            "message": "New session created successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating new session: {str(e)}")

# Endpoint: /email/draft - Draft email helper
@router.post("/email/draft")
async def draft_email(payload: CopilotChatRequest):
    """
    Specialized endpoint for drafting emails with context
    """
    try:
        # Generate session ID if not provided
        session_id = payload.session_id or str(uuid.uuid4())
        
        # Enhance prompt for email drafting
        enhanced_prompt = f"Help me draft an email. {payload.prompt}"
        
        response = copilot.generate_response(
            session_id=session_id,
            prompt=enhanced_prompt,
            context_data=payload.context_data
        )
        
        return {
            "status": "success",
            "session_id": session_id,
            "response": response,
            "type": "email_draft"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error drafting email: {str(e)}")

# Endpoint: /suggest - Get suggestions based on context
@router.post("/suggest")
async def get_suggestions(payload: CopilotChatRequest):
    """
    Get contextual suggestions based on provided data
    """
    try:
        # Generate session ID if not provided
        session_id = payload.session_id or str(uuid.uuid4())
        
        # Enhance prompt for suggestions
        enhanced_prompt = f"Please suggest what I should do about: {payload.prompt}"
        
        response = copilot.generate_response(
            session_id=session_id,
            prompt=enhanced_prompt,
            context_data=payload.context_data
        )
        
        return {
            "status": "success",
            "session_id": session_id,
            "suggestions": response,
            "type": "suggestions"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting suggestions: {str(e)}")