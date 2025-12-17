from fastapi import APIRouter, HTTPException, Request,FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from controller.gemini_support import chatbot
from typing import Optional

router = APIRouter()

# Request schema using Pydantic
class ChatRequest(BaseModel):
    user_id: str
    user_role: str
    prompt: Optional[str] = None  

# Endpoint: /generate_response
@router.post("/generate_response")
async def generate_response(payload: ChatRequest):
    user_id = payload.user_id
    user_role = payload.user_role
    prompt = payload.prompt

    if not user_role:
        raise HTTPException(status_code=400, detail="User role must be provided")
    if not user_id or not prompt:
        raise HTTPException(status_code=400, detail="User ID and prompt must be provided")

    try:
        response = chatbot.generate_response(user_id, user_role, prompt)
        return {"status": "success", "response": response}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Endpoint: /chat_history
@router.post("/chat_history")
async def get_chat_history(payload: ChatRequest):
    user_id = payload.user_id
    user_role = payload.user_role
    print("gemini")
    if not user_role:
        raise HTTPException(status_code=400, detail="User role must be provided")

    try:
        history = chatbot.get_chat_history(user_id, user_role)
        return {"status": "success", "history": history}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Endpoint: /recent_conversation
@router.post("/recent_conversation")
async def get_recent_chat_history(payload: ChatRequest):
    user_id = payload.user_id
    user_role = payload.user_role

    if not user_role:
        raise HTTPException(status_code=400, detail="User role must be provided")

    try:
        recent_conversation = chatbot.get_conversation_summary(user_id, user_role)
        if not recent_conversation:
            raise HTTPException(status_code=404, detail="No conversation found")

        return {"status": "success", "recent": recent_conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app = FastAPI()
app.include_router(router)
