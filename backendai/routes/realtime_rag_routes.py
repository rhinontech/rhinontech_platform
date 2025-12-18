from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import requests
import logging

from services.openai_services import client
from controller.standard_rag_controller import standard_rag_controller

router = APIRouter()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class RealtimeSessionRequest(BaseModel):
    chatbot_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_plan: Optional[str] = None
    conversation_id: Optional[str] = None

@router.post("/realtime/session")
async def generate_realtime_session(request: RealtimeSessionRequest):
    """
    Generates an ephemeral token for the Realtime API.
    Injects Knowledge Base + Chat History explicitly into instructions.
    Manages Conversation Persistence in Postgres.
    """
    chatbot_id = request.chatbot_id
    user_id = request.user_id or "guest"
    user_email = request.user_email or (user_id if '@' in user_id else "guest@example.com")
    user_plan = request.user_plan or "free"
    conversation_id = request.conversation_id
    
    if not chatbot_id:
        raise HTTPException(status_code=400, detail="chatbot_id is required")

    try:
        import uuid
        from datetime import datetime, timezone
        from DB.postgresDB import get_db_connection, run_query, run_write_query
        
        system_instruction = ""
        history_text = ""
        
        with get_db_connection() as conn:
            # A. Manage Conversation ID & Persistence
            is_new = False
            if not conversation_id or conversation_id == "NEW_CHAT":
                conversation_id = str(uuid.uuid4())
                is_new = True
            else:
                 # Check if exists
                 res = run_query(conn, "SELECT 1 FROM bot_conversations WHERE conversation_id = %s", (conversation_id,))
                 if not res:
                     is_new = True
            
            current_time = datetime.now(timezone.utc)
            if is_new:
                 insert_query = """
                    INSERT INTO bot_conversations (user_id, user_email, user_plan, chatbot_id, conversation_id, title, history, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                 """
                 run_write_query(conn, insert_query, (user_id, user_email, user_plan, chatbot_id, conversation_id, "Realtime Session", '[]', current_time, current_time))
            else:
                 # B. Fetch History
                 hist_query = "SELECT history FROM bot_conversations WHERE conversation_id = %s"
                 rows = run_query(conn, hist_query, (conversation_id,))
                 if rows and rows[0][0]:
                     import json
                     raw = rows[0][0]
                     history_list = raw if isinstance(raw, list) else json.loads(raw)
                     # Limit to last 20 messages for audio context
                     recent = history_list[-20:] if len(history_list) > 20 else history_list
                     
                     history_text = "\n\nPrevious Conversation History:\n"
                     for msg in recent:
                         role = msg.get("role", "user")
                         text = msg.get("text", "")
                         history_text += f"{role.title()}: {text}\n"

        # C. Get Knowledge Base Content
        stored_knowledge = await standard_rag_controller.get_stored_knowledge(chatbot_id)
        
        if not stored_knowledge:
             system_instruction = "You are a helpful assistant."
        else:
             truncated_text = stored_knowledge[:20000]
             system_instruction = (
                 "You are a helpful assistant. Use the following knowledge base to answer questions:\n"
                 f"{truncated_text}"
             )
        
        # D. Combine Instructions
        final_instructions = f"{system_instruction}{history_text}"

        # E. Create Session
        url = "https://api.openai.com/v1/realtime/sessions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gpt-4o-realtime-preview-2024-10-01",
            "voice": "verse",
            "instructions": final_instructions,
        }

        response = requests.post(url, headers=headers, json=payload)
        if not response.ok:
            logging.error(f"Realtime Session Error: {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"OpenAI Error: {response.text}")
            
        data = response.json()
        data["conversation_id"] = conversation_id # Return ID to client
        return data

    except Exception as e:
        logging.error(f"Error generating realtime session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class RealtimeSaveRequest(BaseModel):
    conversation_id: str
    messages: list # List of {"role": "user"|"assistant", "text": "..."}
    chatbot_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_plan: Optional[str] = None

@router.post("/realtime/save_conversation")
async def save_realtime_conversation(request: RealtimeSaveRequest):
    """
    Saves new messages from the Client (Realtime API Transcripts) to the Database.
    This allows the backend to maintain a persistent history of the Realtime session.
    """
    conversation_id = request.conversation_id
    new_messages = request.messages
    chatbot_id = request.chatbot_id
    user_id = request.user_id or "guest"
    user_email = request.user_email
    user_plan = request.user_plan

    if not conversation_id or not new_messages:
         return {"message": "No data to save"}

    try:
        from datetime import datetime, timezone
        from DB.postgresDB import get_db_connection, run_query, run_write_query
        import json
        
        current_time = datetime.now(timezone.utc)
        
        # Prepare messages with timestamps
        formatted_msgs = []
        for msg in new_messages:
            formatted_msgs.append({
                "role": msg.get("role", "user"),
                "text": msg.get("text", ""),
                "timestamp": current_time.isoformat()
            })

        with get_db_connection() as conn:
             # Check if conversation exists (it should, from /session)
             res = run_query(conn, "SELECT 1 FROM bot_conversations WHERE conversation_id = %s", (conversation_id,))
             
             if not res:
                  # If missing (edge case), create it
                  insert_query = """
                    INSERT INTO bot_conversations (user_id, user_email, user_plan, chatbot_id, conversation_id, title, history, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                 """
                  title = "Realtime Session (Saved)"
                  run_write_query(conn, insert_query, (user_id, user_email, user_plan, chatbot_id, conversation_id, title, json.dumps(formatted_msgs), current_time, current_time))
             else:
                  # Update History
                  update_query = """
                    UPDATE bot_conversations 
                    SET history = COALESCE(history, '[]'::jsonb) || %s::jsonb, updated_at = %s
                    WHERE conversation_id = %s
                  """
                  run_write_query(conn, update_query, (json.dumps(formatted_msgs), current_time, conversation_id))
                  
        return {"message": "Conversation saved successfully"}

    except Exception as e:
        logging.error(f"Error saving realtime conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
