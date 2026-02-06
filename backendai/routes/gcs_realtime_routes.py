"""
GCS Realtime RAG Routes.

These routes provide the same endpoints as realtime_rag_routes.py but use
Google Cloud Services (Gemini Live API) instead of OpenAI Realtime API.

Endpoints:
- POST /gcs/realtime/session - Generate session config for Gemini Live API
- POST /gcs/realtime/save_conversation - Save conversation history
- POST /gcs/realtime/submit_lead - Submit lead data (shared logic)
- POST /gcs/realtime/search_knowledge - Search knowledge base (uses OpenAI embeddings)
- POST /gcs/realtime/handoff_support - Handoff to support team

For free trial users, the frontend should use these endpoints instead of
the OpenAI-based /realtime/* endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
import json
import uuid
from datetime import datetime, timezone
import asyncio

from DB.postgresDB import (
    get_db_connection,
    run_query,
    run_write_query,
    get_pre_chat_form,
    get_customer_by_email,
    search_vectors,
    move_customer_to_pipeline,
    save_customer,
    create_notification
)
from services.embedding_service import embedding_service
from services.gcs_services import gcs_services
from resources.industry_prompts import INDUSTRY_PROMPTS

router = APIRouter(prefix="/gcs")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


# ==================== Request Models ====================

class RealtimeSessionRequest(BaseModel):
    """Same as realtime_rag_routes.py"""
    chatbot_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_plan: Optional[str] = None
    conversation_id: Optional[str] = None


class RealtimeSaveRequest(BaseModel):
    """Same as realtime_rag_routes.py"""
    conversation_id: str
    messages: list  # List of {"role": "user"|"assistant", "text": "..."}
    chatbot_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_plan: Optional[str] = None


class RealtimeLeadRequest(BaseModel):
    """Same as realtime_rag_routes.py"""
    chatbot_id: str
    email: Optional[str] = None
    name: Optional[str] = ""
    phone: Optional[str] = ""


class RealtimeSearchRequest(BaseModel):
    """Same as realtime_rag_routes.py"""
    chatbot_id: str
    query: str


class RealtimeHandoffRequest(BaseModel):
    """Same as realtime_rag_routes.py"""
    chatbot_id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    urgency: Optional[str] = None
    user_id: Optional[str] = None


# ==================== Endpoints ====================

@router.post("/realtime/session")
async def gcs_generate_realtime_session(request: RealtimeSessionRequest):
    """
    Generates session configuration for Gemini Live API.
    
    This endpoint provides the same functionality as /realtime/session but uses
    Google Cloud Services (Gemini Live API) instead of OpenAI Realtime API.
    
    Returns configuration for client to establish WebSocket connection to:
    wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
    
    Features (all ported from OpenAI version):
    - Knowledge base search tool
    - Lead capture tool
    - Handoff tool
    - Returning user detection
    - Progressive form collection
    - Conversation persistence
    """
    chatbot_id = request.chatbot_id
    user_id = request.user_id or "guest"
    user_email = request.user_email or (user_id if '@' in user_id else "guest@example.com")
    user_plan = request.user_plan or "free"
    conversation_id = request.conversation_id
    
    print(f"🎤 [GCS] VOICE SESSION REQUEST: chatbot_id={chatbot_id}, user_id={user_id}")
    logging.info(f"🎤 [GCS] VOICE SESSION REQUEST: chatbot_id={chatbot_id}, user_id={user_id}")
    
    if not chatbot_id:
        raise HTTPException(status_code=400, detail="chatbot_id is required")
    
    try:
        system_instruction = ""
        history_text = ""
        
        with get_db_connection() as conn:
            # A. Manage Conversation ID & Persistence - SAME AS OpenAI
            is_new = False
            if not conversation_id or conversation_id == "NEW_CHAT":
                conversation_id = str(uuid.uuid4())
                is_new = True
            else:
                res = run_query(conn, "SELECT 1 FROM bot_conversations WHERE conversation_id = %s", (conversation_id,))
                if not res:
                    is_new = True
            
            current_time = datetime.now(timezone.utc)
            if is_new:
                insert_query = """
                    INSERT INTO bot_conversations (user_id, user_email, user_plan, chatbot_id, conversation_id, title, history, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                """
                run_write_query(conn, insert_query, (user_id, user_email, user_plan, chatbot_id, conversation_id, "GCS Realtime Session", '[]', current_time, current_time))
            else:
                # B. Fetch History
                hist_query = "SELECT history FROM bot_conversations WHERE conversation_id = %s"
                rows = run_query(conn, hist_query, (conversation_id,))
                if rows and rows[0][0]:
                    raw = rows[0][0]
                    history_list = raw if isinstance(raw, list) else json.loads(raw)
                    recent = history_list[-20:] if len(history_list) > 20 else history_list
                    
                    history_text = "\n\nPrevious Conversation History:\n"
                    for msg in recent:
                        role = msg.get("role", "user")
                        text = msg.get("text", "")
                        history_text += f"{role.title()}: {text}\n"
        
        # C. Get Organization Type & Industry Prompt
        org_type = "Default"
        try:
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
            logging.error(f"[GCS] Error fetching org type: {e}")
        
        industry_instruction = INDUSTRY_PROMPTS.get(org_type, INDUSTRY_PROMPTS["Default"])
        
        # Base System Instruction - SAME AS OpenAI
        system_instruction = (
            f"{industry_instruction}\n\n"
            "You are the AI Assistant for this organization. "
            "Speak as the organization (use 'we', 'us', 'our'). "
            "Do NOT mention 'Google' or being an AI model from another company. "
            "If asked about your identity, say you are the AI Assistant for the organization. "
            "Use the 'search_knowledge_base' tool to find specific answers. "
            "IMPORTANT: When searching, generate DETAILED, SENTENCE-LENGTH queries that capture the full context. Avoid single-word queries."
            "Always verify your answer with the retrieved context.\n\n"
            "STYLE GUIDELINES (CRITICAL):\n"
            "1. Speak NATURALLY. Use short, punchy sentences.\n"
            "2. Do NOT narrate your internal thought process.\n"
            "3. Do NOT mention the form collection process.\n"
            "4. Be EXTREMELY CONCISE. Answer in 1-2 short sentences max.\n"
            "5. LEAD RULE: On Pricing/Support queries, CHECK if you have Name & Phone. If missing, ASK FIRST. If present, you may answer."
        )
        
        # D. Combine Instructions
        final_instructions = f"{system_instruction}{history_text}"
        
        # D.1 Check for Returning Customer - SAME AS OpenAI
        customer_data = None
        is_returning_user = False
        
        with get_db_connection() as conn:
            if user_email and user_email != "guest@example.com" and "guest@" not in user_email:
                customer_data = get_customer_by_email(chatbot_id, user_email, conn)
                if customer_data:
                    is_returning_user = True
        
        # D.2 Build Instructions & Tools Based on Status
        tools = []
        
        if is_returning_user:
            customer_name = customer_data.get("name", "")
            customer_phone = customer_data.get("phone")
            
            print(f"✅ [GCS] RETURNING USER: {customer_name} ({user_email})")
            logging.info(f"✅ [GCS] RETURNING USER: {customer_name} ({user_email})")
            
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
            
            # Returning user -> Search Tool ONLY + Handoff
            tools = [
                {
                    "type": "function",
                    "function": {
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
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "handoff_to_support",
                        "description": "PRIORITY TOOL. Connects user to support team / human agent. Use IMMEDIATELY if user asks for 'support', 'human', 'team' OR shows strong interest.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "description": "Customer email"},
                                "name": {"type": "string", "description": "Customer name"},
                                "phone": {"type": "string", "description": "Customer phone"},
                                "urgency": {
                                    "type": "string",
                                    "enum": ["immediate", "later"],
                                    "description": "Set to 'immediate' if user explicitly asks for a call NOW or URGENTLY. Set to 'later' for general interest."
                                }
                            },
                            "required": ["email"]
                        }
                    }
                }
            ]
            
            final_instructions += (
                f"\n[LEAD QUALIFICATION & HANDOFF]\n"
                f"RULES FOR HANDOFF:\n"
                f"1. IF user asks for 'Support', 'Human', 'Connect' OR shows High Interest -> HANDOFF IMMEDIATELY.\n"
                f"2. You MUST pass the email '{user_email}' to the tool.\n"
                f"3. Do NOT ask 'What specific area?'.\n"
                f"4. FIRST: Call 'handoff_to_support' with urgency='later' to save lead.\n"
                f"5. THEN ASK: 'Would you like to connect with an agent right now?'\n"
                f"6. IF YES: Call 'handoff_to_support' AGAIN with urgency='immediate'.\n"
                f"7. IF NO: Say 'Okay, our team will contact you soon!'"
            )
            
        else:
            # NEW USER Logic -> Add Form Collection
            with get_db_connection() as conn:
                form_config = get_pre_chat_form(chatbot_id, conn)
            
            # Default Tool: Search
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "search_knowledge_base",
                        "description": "Search for specific facts, prices, policies, or details. Do NOT use if user asks for 'Support', 'Human', or 'Team' - use handoff_to_support instead.",
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
                    }
                }
            ]
            
            print(f"🔍 [GCS] DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
            logging.info(f"🔍 [GCS] DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
            
            # Build Form Tool (Always available now)
            properties = {
                "name": {"type": "string", "description": "Customer Name"},
                "email": {"type": "string", "description": "Customer Email"},
                "phone": {"type": "string", "description": "Customer Phone"}
            }
            required_fields = ["name", "email", "phone"]
            extra_field_labels = []

            if form_config:
                for field in form_config:
                    field_id = field.get("id", "unknown")
                    if field_id in ["name", "email", "phone"]:
                        continue
                    
                    f_type = "string"
                    if field.get("type") == "number": f_type = "number"
                    
                    properties[field_id] = {"type": f_type, "description": field.get("label", field_id)}
                    if field.get("required"): required_fields.append(field_id)
                    extra_field_labels.append(field.get("label", field_id))
            
            fields_str = ""
            if extra_field_labels:
                fields_str = " AND " + ", ".join(extra_field_labels)

            tools.append({
                "type": "function",
                "function": {
                    "name": "submit_pre_chat_form",
                    "description": "Submit user details. Call ONLY after collecting Name, Email, Phone, and other required fields.",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required_fields
                    }
                }
            })
            
            # Handoff Tool
            tools.append({
                "type": "function",
                "function": {
                    "name": "handoff_to_support",
                    "description": "PRIORITY TOOL. Connects user to support team / human agent. Use IMMEDIATELY if user asks for 'support', 'human', 'team' OR shows strong interest.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "email": {"type": "string", "description": "Customer email"},
                            "name": {"type": "string", "description": "Customer name"},
                            "phone": {"type": "string", "description": "Customer phone"},
                            "urgency": {
                                "type": "string",
                                "enum": ["immediate", "later"],
                                "description": "Set to 'immediate' if user explicitly asks for a call NOW or URGENTLY."
                            }
                        },
                        "required": ["email"]
                    }
                }
            })
                    
            # Progressive Form Collection - EXACT STANDARD RAG LOGIC
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
                f"\n[SUPPORT HANDOFF (CRITICAL)]\n"
                f"You must proactively capture the user's details (Name, Email, Phone) and move them to the pipeline if they show HIGH INTEREST.\n"
                f"Triggers for HIGH INTEREST include:\n"
                f"1. Asking about PRICING or cost.\n"
                f"2. Asking for comparisons with COMPETITORS (e.g., Freshworks, Intercom).\n"
                f"3. Asking deep/detailed questions about COMPANY FEATURES or technical specs.\n"
                f"4. Explicitly asking to speak to a human or support.\n"
                f"ACTION IF TRIGGERED:\n"
                f"1. Check if you have Name, Email, Phone. If missing, ASK for them politely one by one.\n"
                f"2. Once you have the details, call 'handoff_to_support' with urgency='later' to save them to the pipeline first.\n"
                f"3. AFTER saving, ASK the user: 'I have added you to our priority queue. would you like to connect with a support agent immediately?'\n"
                f"4. IF USER SAYS YES: Call 'handoff_to_support' AGAIN with urgency='immediate'.\n"
                f"5. IF USER SAYS NO: Say 'Great! Our team will reach out to you shortly.'\n"
            )

        
        # E. Get Gemini Live API Config
        config = gcs_services.get_live_api_config(
            instructions=final_instructions,
            tools=tools,
            voice_name="Aoede"  # Female voice (options: Puck, Charon, Kore, Fenrir, Aoede)
        )
        
        # Return session config for client
        return {
            "websocket_url": "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",
            "api_key": GOOGLE_API_KEY,
            "config": config,
            "conversation_id": conversation_id,
            "model": "models/gemini-2.5-flash-native-audio-latest",
            "modalities": ["text", "audio"],
            "turn_detection": {
                "type": "server_vad",
                "threshold": 0.5,
                "prefix_padding_ms": 200,
                "silence_duration_ms": 400
            }
        }
        
    except Exception as e:
        logging.error(f"[GCS] Error generating realtime session: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/realtime/save_conversation")
async def gcs_save_realtime_conversation(request: RealtimeSaveRequest):
    """
    Saves new messages from the Client (Realtime API Transcripts) to the Database.
    SAME LOGIC as OpenAI version.
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
        current_time = datetime.now(timezone.utc)
        
        formatted_msgs = []
        for msg in new_messages:
            formatted_msgs.append({
                "role": msg.get("role", "user"),
                "text": msg.get("text", ""),
                "timestamp": current_time.isoformat()
            })
        
        with get_db_connection() as conn:
            res = run_query(conn, "SELECT 1 FROM bot_conversations WHERE conversation_id = %s", (conversation_id,))
            
            if not res:
                insert_query = """
                    INSERT INTO bot_conversations (user_id, user_email, user_plan, chatbot_id, conversation_id, title, history, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                """
                title = "GCS Realtime Session (Saved)"
                run_write_query(conn, insert_query, (user_id, user_email, user_plan, chatbot_id, conversation_id, title, json.dumps(formatted_msgs), current_time, current_time))
            else:
                update_query = """
                    UPDATE bot_conversations 
                    SET history = COALESCE(history, '[]'::jsonb) || %s::jsonb, updated_at = %s
                    WHERE conversation_id = %s
                """
                run_write_query(conn, update_query, (json.dumps(formatted_msgs), current_time, conversation_id))
        
        return {"message": "Conversation saved successfully"}
        
    except Exception as e:
        logging.error(f"[GCS] Error saving realtime conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/realtime/submit_lead")
async def gcs_submit_realtime_lead(request: RealtimeLeadRequest):
    """
    Endpoint for the Frontend SDK to call when the Realtime AI triggers 'submit_pre_chat_form'.
    SAME LOGIC as OpenAI version.
    """
    try:
        chatbot_id = request.chatbot_id
        email = request.email
        
        print(f"📝 [GCS] SUBMIT LEAD DEBUG: email='{email}', name='{request.name}', phone='{request.phone}'")
        logging.info(f"📝 [GCS] SUBMIT LEAD DEBUG: email='{email}', name='{request.name}', phone='{request.phone}'")
        
        custom_data = {
            "name": request.name,
            "phone": request.phone,
            "source": "gcs_voice_chatbot",
            "chatbot_id": chatbot_id
        }
        
        if not email:
            return {"status": "partial", "message": "Details received. Please ask for Email to complete the record."}
        
        success = save_customer(chatbot_id, email, custom_data)
        
        if success:
            return {"status": "success", "message": "Lead saved/updated"}
        else:
            return {"status": "error", "message": "Failed to save lead"}
    
    except Exception as e:
        logging.error(f"[GCS] Error submitting lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/realtime/search_knowledge")
async def gcs_search_knowledge_base_endpoint(request: RealtimeSearchRequest):
    """
    Endpoint for the Frontend SDK to call when the Realtime AI triggers 'search_knowledge_base'.
    Uses OpenAI embeddings (shared) for vector search.
    SAME LOGIC as OpenAI version.
    """
    try:
        # Embed query using OpenAI embeddings (shared)
        query_vector = embedding_service.embed_text(request.query)
        
        results = await asyncio.to_thread(search_vectors, request.chatbot_id, query_vector, limit=5)
        
        if results:
            content = "\n\n".join([f"[CHUNK]: {r['content']}" for r in results])
            return {"result": content}
        
        return {"result": "No relevant information found in the knowledge base."}
        
    except Exception as e:
        logging.error(f"[GCS] Error searching knowledge base: {e}")
        return {"result": "Error searching knowledge base."}


@router.post("/realtime/handoff_support")
async def gcs_handoff_support_endpoint(request: RealtimeHandoffRequest):
    """
    Endpoint for 'handoff_to_support' tool.
    SAME LOGIC as OpenAI version.
    """
    try:
        chatbot_id = request.chatbot_id
        email = request.email
        name = request.name
        phone = request.phone
        urgency = request.urgency
        
        if not email:
            return {"result": "Email required for handoff."}
        
        # 1. Update/Save Customer
        if name or phone:
            c_data = {
                "name": name,
                "phone": phone,
                "source": "gcs_voice_chatbot",
                "chatbot_id": chatbot_id
            }
            save_customer(chatbot_id, email, c_data)
        
        # 2. Check Urgency
        if urgency == 'immediate':
            title = f"Urgent Callback: {name or email}"
            message = f"User has requested an immediate callback via GCS voice. Phone: {phone or 'N/A'}"
            data = {
                "email": email,
                "phone": phone,
                "name": name,
                "chatbot_id": chatbot_id,
                "user_id": request.user_id
            }
            create_notification(chatbot_id, "call", title, message, data)
            return {"result": "Immediate callback requested. Our team has been notified!"}
        
        # 3. Move to Pipeline
        with get_db_connection() as conn:
            success = move_customer_to_pipeline(chatbot_id, email, conn)
        
        if success:
            return {"result": "Customer moved to priority support pipeline."}
        else:
            return {"result": "Failed to move to pipeline. Please try again."}
    
    except Exception as e:
        logging.error(f"[GCS] Error in handoff: {e}")
        return {"result": "Error processing handoff."}


@router.get("/realtime/health")
async def gcs_realtime_health_check():
    """Health check for GCS realtime routes."""
    return {"status": "ok", "service": "gcs-realtime"}
