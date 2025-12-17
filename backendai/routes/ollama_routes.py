"""
Ollama Routes - Lead Generation Chatbot API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import logging

from controller.ollama_controller import OllamaController

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ollama", tags=["Ollama Lead Gen"])

# Initialize controller
ollama_controller = OllamaController()


# Request/Response Models
class CreateSessionRequest(BaseModel):
    organization_id: str
    model: Optional[str] = "rhinon-support"


class ChatRequest(BaseModel):
    session_id: str
    message: str
    model: Optional[str] = "rhinon-support"


class EndSessionRequest(BaseModel):
    session_id: str


class TrainModelRequest(BaseModel):
    organization_id: str
    instructions: str
    knowledge_base: str


# Endpoints
@router.post("/session/create")
async def create_session(request: CreateSessionRequest):
    """
    Create a new chat session
    
    Returns:
        session_id and initial greeting
    """
    try:
        session_id = ollama_controller.create_session(request.organization_id)
        session = ollama_controller.get_session(session_id)
        
        return {
            "success": True,
            "session_id": session_id,
            "greeting": session.messages[0]["content"],
            "lead_data": session.lead_data
        }
        
    except Exception as e:
        logger.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Send message and get response
    Handles lead generation flow automatically
    
    Returns:
        assistant response, lead data, and current step
    """
    try:
        result = ollama_controller.chat(
            session_id=request.session_id,
            user_message=request.message,
            model=request.model
        )
        
        return {
            "success": True,
            **result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/end")
async def end_session(request: EndSessionRequest):
    """
    End session and generate summary
    
    Returns:
        summary, lead data, and session stats
    """
    try:
        result = ollama_controller.end_session(request.session_id)
        
        return {
            "success": True,
            **result
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"End session failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Get full session history
    
    Returns:
        complete session data with all messages
    """
    try:
        session_data = ollama_controller.get_session_history(session_id)
        
        return {
            "success": True,
            **session_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Get session failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def list_sessions(organization_id: Optional[str] = None):
    """
    List all sessions, optionally filtered by organization
    
    Returns:
        list of session summaries
    """
    try:
        sessions = ollama_controller.list_sessions(organization_id)
        
        return {
            "success": True,
            "sessions": sessions,
            "count": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"List sessions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
async def train_model(request: TrainModelRequest):
    """
    Train/update custom model for organization
    Edits Modelfile and creates new model
    
    Args:
        organization_id: Org identifier
        instructions: Custom behavior instructions
        knowledge_base: Knowledge base content
        
    Returns:
        model name and training status
    """
    try:
        result = ollama_controller.train_model(
            organization_id=request.organization_id,
            instructions=request.instructions,
            knowledge_base=request.knowledge_base
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Model training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream/chat")
async def stream_chat(request: ChatRequest):
    """
    Stream chat response (for future implementation)
    Currently returns regular response
    """
    # For now, use regular chat
    # TODO: Implement streaming with Server-Sent Events
    return await chat(request)
