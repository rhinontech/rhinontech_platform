from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import requests
import logging

import uuid
from datetime import datetime, timezone
import asyncio
from DB.postgresDB import get_db_connection, run_query, run_write_query, get_pre_chat_form, get_customer_by_email, search_vectors, move_customer_to_pipeline, save_customer
from services.openai_services import client
from controller.standard_rag_controller import standard_rag_controller
from services.embedding_service import embedding_service
from resources.industry_prompts import INDUSTRY_PROMPTS

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
        
        # C.2 Get Organization Type & Industry Prompt (Parity with Standard RAG)
        org_type = "Default"
        try:
             # Use existing connection or new one? We have 'conn' from depends if we want, or make new.
             # controller/standard_rag_controller.py uses a static method query on 'chatbots'.
             # Let's do a quick query here.
             with get_db_connection() as type_conn:
                 type_query = """
                    SELECT o.organization_type 
                    FROM organizations o
                    JOIN chatbots c ON o.id = c.organization_id
                    WHERE c.chatbot_id = %s
                 """
                 type_res = run_query(type_conn, type_query, (chatbot_id,))
                 if type_res and type_res[0]:
                     org_type = type_res[0][0] or "Default"
        except Exception as e:
             logging.error(f"Error fetching org type: {e}")
             
        industry_instruction = INDUSTRY_PROMPTS.get(org_type, INDUSTRY_PROMPTS["Default"])

        # Base System Instruction
        system_instruction = (
            f"{industry_instruction}\n\n"
            "You are the AI Assistant for this organization. "
            "Speak as the organization (use 'we', 'us', 'our'). "
            "Do NOT mention 'OpenAI' or being an AI model from another company. "
            "If asked about your identity, say you are the AI Assistant for the organization. "
            "Use the 'search_knowledge_base' tool to find specific answers. "
            "IMPORTANT: When searching, generate DETAILED, SENTENCE-LENGTH queries that capture the full context. Avoid single-word queries."
            "Always verify your answer with the retrieved context."
        )
        
        # D. Combine Instructions
        final_instructions = f"{system_instruction}{history_text}"

        # D.1 Check for Returning Customer
        customer_data = None
        is_returning_user = False
        
        if user_email and user_email != "guest@example.com" and "guest@" not in user_email:
            customer_data = get_customer_by_email(chatbot_id, user_email, conn)
            if customer_data:
                 is_returning_user = True
        
        # D.2 Build Instructions Based on Status
        if is_returning_user:
            customer_name = customer_data.get("name", "")
            customer_phone = customer_data.get("phone")
            
            print(f"✅ RETURNING USER: {customer_name} ({user_email})")
            logging.info(f"✅ RETURNING USER: {customer_name} ({user_email})")
            
            missing_phone_instruction = ""
            missing_phone_instruction = ""
            if not customer_phone:
                missing_phone_instruction = "Note: You are MISSING their Phone Number. Only ask for it IF they want to proceed with a purchase or support. Do not ask immediately."

            final_instructions += (
                f"\n\n[USER CONTEXT]\n"
                f"You are speaking with a user whose email is: {user_email}.\n"
                f"You MUST use this email ('{user_email}') when calling any tools.\n"
                f"The user is {customer_name}, a valued returning customer.\n"
                f"Greet them warmly by name at the start of the conversation.\n"
                f"{missing_phone_instruction}\n"
                f"Your goal is to answer their questions AND detect if they want support/purchasing.\n"
            )
            # Returning user -> Search Tool ONLY
            tools = [{
                "type": "function",
                "name": "search_knowledge_base",
                "description": "Search for specific facts, prices, policies, or details. Use verbose, sentence-like queries.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "A detailed search query including all relevant context from the user's question. Do not use short keywords."
                        }
                    },
                    "required": ["query"]
                }
            }]

            # Add Handoff Tool for Returning Users too
            tools.append({
                "type": "function",
                "name": "handoff_to_support",
                "description": "PRIORITY TOOL. Connects user to support team / human agent. Use IMMEDIATELY if user asks for 'support', 'human', 'team' OR shows strong interest. Do NOT ask 'what area' - just connect.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "description": "Customer email"},
                        "name": {"type": "string", "description": "Customer name"},
                        "phone": {"type": "string", "description": "Customer phone"}
                    },
                "required": ["email"]
                }
            })

            final_instructions += (
                f"\n[LEAD QUALIFICATION & HANDOFF]\n"
                f"RULES FOR HANDOFF:\n"
                f"1. IF user asks for 'Support', 'Human', 'Connect' OR shows High Interest -> HANDOFF IMMEDIATELY.\n"
                f"2. You MUST pass the email '{user_email}' to the tool.\n"
                f"3. Do NOT ask 'What specific area?'.\n"
                f"4. Say 'Connecting you now... Our team will reach out to you soon!' and call the tool."
            )
            
        else:
             # NEW USER Logic -> Add Form Collection
             form_config = get_pre_chat_form(chatbot_id, conn)
        
             # Default Tool: Search
             tools = [{
                "type": "function",
                "name": "search_knowledge_base",
                "description": "Search for specific facts, prices, policies, or details. do NOT use if user asks for 'Support', 'Human', or 'Team' - use handoff_to_support instead.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "A detailed search query including all relevant context from the user's question. Do not use short keywords."
                        }
                    },
                    "required": ["query"]
                }
             }]
        
             print(f"🔍 DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
             logging.info(f"🔍 DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
        
             if form_config:
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
            
                if properties:
                    tools.append({
                        "type": "function",
                        "name": "submit_pre_chat_form",
                        "description": "Submit user form data. You MUST have collected Name, Email, and Phone before calling this function.",
                        "parameters": {
                            "type": "object",
                            "properties": properties,
                            "required": required_fields # Enforce required fields defined in form config
                        }
                    })

                    # Add Handoff Tool
                    tools.append({
                        "type": "function",
                        "name": "handoff_to_support",
                        "description": "PRIORITY TOOL. Connects user to support team / human agent. Use IMMEDIATELY if user asks for 'support', 'human', 'team' OR shows strong interest. Do NOT ask 'what area' - just connect.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "description": "Customer email"},
                                "name": {"type": "string", "description": "Customer name"},
                                "phone": {"type": "string", "description": "Customer phone"}
                            },
                            "required": ["email"]
                        }
                    })
                
                    # Append to System Instruction
                    field_descriptions = []
                    for f_id, f_prop in properties.items():
                        field_descriptions.append(f"- {f_prop['description']} (internal_id: {f_id})")
                
                    # Updated system instruction - wait 3 messages before asking for details
                    if is_returning_user:
                         # Fetch Customer Details to inject into context
                         customer_context_str = ""
                         try:
                             # We need to make a fresh connection or use existing if accessible. 
                             # Since we are in an async route, we should use a new connection or the one used before if still open?
                             # safer to open a quick one.
                             with get_db_connection() as conn:
                                 cust = get_customer_by_email(chatbot_id, user_email, conn)
                                 if cust:
                                     c_name = cust.get("name")
                                     c_phone = cust.get("phone")
                                     if c_name: 
                                         customer_context_str += f"Name: {c_name}\n"
                                         # Add friendly instruction
                                         customer_context_str += f"IMPORTANT: Address the user by their name ({c_name}) occasionally, but NOT in every sentence.\n"
                                     if c_phone: customer_context_str += f"Phone: {c_phone}\n"
                         except Exception as e:
                             print(f"Error fetching customer context for voice: {e}")

                         # If we already know the email (returning user or context), just ask for missing info or confirm.
                         final_instructions += (
                            f"\n\n[USER CONTEXT]\n"
                            f"You are speaking with a user whose email is: {user_email}.\n"
                            f"{customer_context_str}"
                            f"Since you already have their email, do NOT ask for it again.\n"
                            f"However, if you do not have their Name or Phone in the context above, please ask for those politely after 3 turns.\n"
                            f"IMPORTANT: Do NOT say 'Welcome back' at the start of every response. Speak naturally."
                         )
                    else:
                         final_instructions += (
                            f"\n\n[PROGRESSIVE FORM COLLECTION]\n"
                            f"First, engage naturally with the user. Answer their questions helpfully for 3 conversation turns.\n"
                            f"After 3 turns, you must collect: Name, Email, and Phone Number.\n"
                            f"CRITICAL: Ask for these details ONE BY ONE. Do NOT ask for all three at once.\n"
                            f"1. Ask for the Name. Wait for answer.\n"
                            f"2. Ask for the Email. Wait for answer.\n"
                            f"3. Ask for the Phone Number. Wait for answer.\n"
                            f"Once you have all three values (name, email, phone), call the 'submit_pre_chat_form' function immediately.\n"
                            f"After calling the function, do NOT tell the user 'I have saved your details'. Just say 'Thanks!' or 'Got it!' and continue.\n"
                         )

                    final_instructions += (
                        f"\n[LEAD QUALIFICATION & HANDOFF]\n"
                        f"RULES FOR HANDOFF:\n"
                        f"1. IF user asks for 'Support', 'Human', 'Connect' OR shows High Interest -> HANDOFF IMMEDIATELY.\n"
                        f"2. Do NOT ask 'What specific area?' or 'What is your query?'.\n"
                        f"3. CHECK CONTEXT: If you strictly need Name/Email/Phone and don't have them, ASK for them first. Then call 'handoff_to_support'.\n"
                        f"3. CHECK CONTEXT: If you strictly need Name/Email/Phone and don't have them, ASK for them first. Then call 'handoff_to_support'.\n"
                        f"4. Say 'Connecting you now... Our team will reach out to you soon!' and call the tool."
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

    if not conversation_id or not new_messages:
         return {"message": "No data to save"}

    try:
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
    email: Optional[str] = None
    name: Optional[str] = ""
    phone: Optional[str] = ""
    
@router.post("/realtime/submit_lead")
async def submit_realtime_lead(request: RealtimeLeadRequest):
    """
    Endpoint for the Frontend SDK to call when the Realtime AI triggers 'submit_pre_chat_form'.
    Saves the lead details to the customers table.
    """
    try:
        import json
        
        chatbot_id = request.chatbot_id
        email = request.email
        
        print(f"📝 SUBMIT LEAD DEBUG: email='{email}', name='{request.name}', phone='{request.phone}'")
        logging.info(f"📝 SUBMIT LEAD DEBUG: email='{email}', name='{request.name}', phone='{request.phone}'")

        custom_data = {
            "name": request.name,
            "phone": request.phone,
            "source": "voice_chatbot",
            "chatbot_id": chatbot_id
        }
        
        # Guard clause: If email is missing, we cannot save properly via save_customer (DB constraint).
        if not email:
             # We received some data (like name), but can't save to DB yet.
             # Return success so the bot continues to ask for the next field.
             return {"status": "partial", "message": "Details received. Please ask for Email to complete the record."}

        # Use shared helper
        success = save_customer(chatbot_id, email, custom_data)
        
        if success:
             return {"status": "success", "message": "Lead saved/updated"}
        else:
             return {"status": "error", "message": "Failed to save lead"}


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
        # Search
        # Embed query first
        query_vector = embedding_service.embed_text(request.query)
        
        # Run in thread since DB ops are blocking if not async specific
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

class RealtimeHandoffRequest(BaseModel):
    chatbot_id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None

@router.post("/realtime/handoff_support")
async def handoff_support_endpoint(request: RealtimeHandoffRequest):
    """
    Endpoint for 'handoff_to_support' tool.
    Moves customer to pipeline.
    """
    try:
        chatbot_id = request.chatbot_id
        email = request.email
        name = request.name
        phone = request.phone
        
        if not email:
             return {"result": "Email required for handoff."}
             
        # 1. Update/Save Customer
        if name or phone:
            c_data = {
                "name": name,
                "phone": phone,
                "source": "voice_chatbot",
                "chatbot_id": chatbot_id
            }
            # Use save_customer imported helper
            save_customer(chatbot_id, email, c_data)

        # 2. Move to Pipeline
        with get_db_connection() as conn:
             success = move_customer_to_pipeline(chatbot_id, email, conn)
             
        if success:
             return {"result": "Customer moved to priority support pipeline."}
        else:
             return {"result": "Failed to move to pipeline. Please try again."}

    except Exception as e:
        logging.error(f"Error in handoff: {e}")
        return {"result": "Error processing handoff."}
