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
    
    print(f"🎤 VOICE SESSION REQUEST: chatbot_id={chatbot_id}, user_id={user_id}")
    logging.info(f"🎤 VOICE SESSION REQUEST: chatbot_id={chatbot_id}, user_id={user_id}")
    
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

        # C. Get Knowledge Base Content - REMOVED for Optimization
        # stored_knowledge = await standard_rag_controller.get_stored_knowledge(chatbot_id) 
        
        # Base System Instruction
        system_instruction = (
            "You are the AI Assistant for this organization. "
            "Speak as the organization (use 'we', 'us', 'our'). "
            "Do NOT mention 'OpenAI' or being an AI model from another company. "
            "If asked about your identity, say you are the AI Assistant for the organization. "
            "Use the 'search_knowledge_base' tool to find specific answers. "
            "Always verify your answer with the retrieved context."
        )
        
        # D. Combine Instructions
        final_instructions = f"{system_instruction}{history_text}"

        # D.1 Check for Pre-Chat Form (Function Calling) & Inject Instructions
        from DB.postgresDB import get_pre_chat_form
        form_config = get_pre_chat_form(chatbot_id)
        
        # Defines tools list with the Search Tool by default
        tools = [{
            "type": "function",
            "name": "search_knowledge_base",
            "description": "Search for specific facts, prices, policies, or details. Use specific, keyword-rich queries (e.g., 'price of plan A' instead of 'price').",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find relevant information."
                    }
                },
                "required": ["query"]
            }
        }]
        
        print(f"🔍 DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
        logging.info(f"🔍 DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
        
        if form_config:
            # Generate Tool Definition from Form Config
            properties = {}
            required_fields = []
            
            for field in form_config:
                field_id = field.get("id", "unknown")
                field_type = "string" # Default
                if field.get("type") == "number": field_type = "number"
                
                properties[field_id] = {
                    "type": field_type,
                    "description": field.get("label", field_id)
                }
                if field.get("required"):
                    required_fields.append(field_id)
            
            print(f"🔍 DEBUG: properties={properties}, required_fields={required_fields}")
            logging.info(f"🔍 DEBUG: properties={properties}, required_fields={required_fields}")
            
            if properties:
                tools.append({
                    "type": "function",
                    "name": "submit_pre_chat_form",
                    "description": "Submit user form data when they provide it.",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required_fields
                    }
                })
                
                print(f"✅ DEBUG: Tools generated: {len(tools)} tool(s)")
                logging.info(f"✅ DEBUG: Tools generated: {len(tools)} tool(s)")
                
                # Append to System Instruction
                field_descriptions = []
                for f_id, f_prop in properties.items():
                    field_descriptions.append(f"- {f_prop['description']} (internal_id: {f_id})")
                
                final_instructions += (
                    f"\n\n[CONVERSATION GUIDELINES]\n"
                    f"Engage naturally with the user. Take your time to respond thoughtfully.\n"
                    f"After 4-6 conversation turns, collect Name, Email, and Phone Number.\n"
                    f"Ask for ONE detail at a time. Wait for their response before asking the next.\n"
                    f"Once you have all three, call 'submit_pre_chat_form' tool.\n"
                    f"After calling the tool, acknowledge briefly and continue the conversation."
                )
        else:
            print(f"⚠️ DEBUG: No form_config found for chatbot_id={chatbot_id}")
            logging.warning(f"⚠️ DEBUG: No form_config found for chatbot_id={chatbot_id}")

        # E. Create Session
        url = "https://api.openai.com/v1/realtime/sessions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gpt-realtime-mini",
            "voice": "alloy",  # Professional, neutral English voice (other options: echo, shimmer, ash, ballad, coral, sage, verse)
            "instructions": final_instructions,
            "modalities": ["text", "audio"],
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 300,
                "silence_duration_ms": 700  # Wait 700ms of silence before responding
            }
        }
        
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

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

class RealtimeLeadRequest(BaseModel):
    chatbot_id: str
    email: str
    name: Optional[str] = ""
    phone: Optional[str] = ""
    
@router.post("/realtime/submit_lead")
async def submit_realtime_lead(request: RealtimeLeadRequest):
    """
    Endpoint for the Frontend SDK to call when the Realtime AI triggers 'submit_pre_chat_form'.
    Saves the lead details to the customers table.
    """
    try:
        from DB.postgresDB import get_db_connection, run_query, run_write_query
        import json
        
        chatbot_id = request.chatbot_id
        email = request.email
        custom_data = {
            "name": request.name,
            "phone": request.phone,
            "source": "voice_chatbot",
            "chatbot_id": chatbot_id
        }
        
        with get_db_connection() as conn:
            # 1. Get Organization ID
            org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
            org_result = run_query(conn, org_query, (chatbot_id,))
            
            if not org_result or not org_result[0]:
                raise HTTPException(status_code=404, detail="Chatbot not found")
                
            org_id = org_result[0][0]
            
            # 2. Check if customer exists
            check_query = "SELECT id FROM customers WHERE organization_id = %s AND email = %s"
            existing = run_query(conn, check_query, (org_id, email))
            
            if existing and existing[0]:
                 # Update
                 update_query = """
                    UPDATE customers 
                    SET custom_data = custom_data || %s::jsonb, updated_at = NOW()
                    WHERE organization_id = %s AND email = %s
                 """
                 run_write_query(conn, update_query, (json.dumps(custom_data), org_id, email))
                 return {"status": "success", "message": "Lead updated"}
            else:
                 # Insert
                 insert_query = """
                    INSERT INTO customers (organization_id, email, custom_data, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                 """
                 run_write_query(conn, insert_query, (org_id, email, json.dumps(custom_data)))
                 return {"status": "success", "message": "Lead created"}

    except Exception as e:
        logging.error(f"Error submitting lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class RealtimeSearchRequest(BaseModel):
    chatbot_id: str
    query: str

@router.post("/realtime/search_knowledge")
async def search_knowledge_base_endpoint(request: RealtimeSearchRequest):
    """
    Endpoint for the Frontend SDK to call when the Realtime AI triggers 'search_knowledge_base'.
    Performs a vector search and returns relevant chunks.
    """
    try:
        from services.embedding_service import embedding_service
        from controller.standard_rag_controller import standard_rag_controller # Ensure import
        
        # Reuse standard RAG logic: Embed -> Search
        # But wait, standard_rag_controller.chat_stream does it all. 
        # We just want the vector search part.
        # standard_rag_controller has search_vectors imported from DB.postgresDB
        from DB.postgresDB import search_vectors
        
        # Embed query
        query_vector = embedding_service.embed_text(request.query)
        if not query_vector:
             return {"result": "Could not process query."}
             
        # Search
        # Run in thread since DB ops are blocking if not async specific
        import asyncio
        results = await asyncio.to_thread(search_vectors, request.chatbot_id, query_vector, limit=5)
        
        if results:
            # Format for the AI
            content = "\n\n".join([f"[CHUNK]: {r['content']}" for r in results])
            return {"result": content}
        
        return {"result": "No relevant information found in the knowledge base."}

    except Exception as e:
        logging.error(f"Error searching knowledge base: {e}")
        # Don't fail the client call entirely, just return error text
        return {"result": "Error searching knowledge base."}
