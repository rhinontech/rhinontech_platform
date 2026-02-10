"""
GCS Standard RAG Controller.

This controller provides the same functionality as standard_rag_controller.py
but uses Google's Gemini instead of OpenAI for chat completion.

Features (all ported from OpenAI version):
- Vector search context (uses existing OpenAI embeddings)
- Industry-specific prompts
- Conversation history management
- Progressive form collection (Name → Email → Phone)
- Wait 3 turns rule
- Heavy intent triggers (pricing, competitors, support)
- Returning user detection
- Function calling (submit_pre_chat_form, handoff_to_support)
- Recursive call after tool execution
"""

import logging
import asyncio
import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

from services.embedding_service import embedding_service  # Reuse OpenAI embeddings
from services.gcs_services import gcs_services
from DB.postgresDB import (
    postgres_connection,
    run_query,
    run_write_query,
    search_vectors,
    get_db_connection,
    get_pre_chat_form,
    get_customer_by_email,
    move_customer_to_pipeline,
    save_customer,
    get_conversation_metadata,
    update_conversation_email,
    create_notification
)
from resources.industry_prompts import INDUSTRY_PROMPTS

# MODULE LOAD CONFIRMATION
logging.info("=" * 80)
logging.info("🔥🔥🔥 GCS STANDARD RAG CONTROLLER MODULE LOADED - NEW CODE VERSION 🔥🔥🔥")
logging.info("=" * 80)


class GCSStandardRAGController:
    """
    GCS version of StandardRAGController.
    
    Uses Gemini instead of OpenAI for chat, but reuses:
    - OpenAI embeddings for vector search
    - Same database operations
    - Same business logic for lead capture
    """
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            logging.info("✅ GCS Standard RAG Controller initialized")
        else:
            logging.warning("⚠️ GOOGLE_API_KEY not found")
    
    @staticmethod
    def get_organization_type(chatbot_id: str) -> str:
        """
        Fetches the organization type for a given chatbot.
        SAME AS standard_rag_controller.py
        """
        try:
            with get_db_connection() as conn:
                query = """
                    SELECT o.organization_type 
                    FROM organizations o
                    JOIN chatbots c ON o.id = c.organization_id
                    WHERE c.chatbot_id = %s
                """
                with conn.cursor() as cur:
                    cur.execute(query, (chatbot_id,))
                    result = cur.fetchone()
                    if result:
                        return result[0] or "Default"
            return "Default"
        except Exception as e:
            logging.error(f"Error fetching organization type: {e}")
            return "Default"
    
    @staticmethod
    def _validate_email_arg(email_arg: str):
        """
        Validates email to prevent 'fake' or 'guest' emails.
        Returns: (is_valid: bool, error_message: str)
        """
        if not email_arg:
            return False, "Email is missing. You MUST ask the user for their email."
            
        lower_email = email_arg.lower().strip()
        
        # Hallucination Checks
        blacklist = ["guest", "example.com", "returning.customer", "user@", "email@"]
        for bad_str in blacklist:
            if bad_str in lower_email:
                return False, f"Invalid Email '{email_arg}'. You are using a placeholder. You MUST ASK the user for their real email."
        
        # Basic Syntax Check
        if "@" not in lower_email or "." not in lower_email:
             return False, "Email format is invalid. Please ask for a valid email address."
             
        return True, ""
    
    def _build_tools(self, form_config: List[Dict]) -> Optional[List[Dict]]:
        """
        Build tools. 
        MANDATORY: Always include submit_pre_chat_form with Name/Email/Phone.
        OPTIONAL: Add extra fields from form_config.
        """
        # Base mandatory fields
        properties = {
            "name": {"type": "string", "description": "Customer Name"},
            "email": {"type": "string", "description": "Customer Email"},
            "phone": {"type": "string", "description": "Customer Phone Number"}
        }
        required_fields = ["name", "email", "phone"]
        
        # Add extra fields from config
        if form_config:
            for field in form_config:
                field_id = field.get("id", "unknown")
                
                # Skip if already in base (we force standard ones)
                if field_id in ["name", "email", "phone"]:
                    continue
                    
                field_type = "string"
                if field.get("type") == "number":
                    field_type = "number"
                
                properties[field_id] = {
                    "type": field_type,
                    "description": field.get("label", field_id)
                }
                
                if field.get("required"):
                    required_fields.append(field_id)
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "submit_pre_chat_form",
                    "description": "Submit user form data. Call this ONLY after collecting Name, Email, Phone, and other required fields.",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required_fields
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "handoff_to_support",
                    "description": "Moves the customer to the priority support pipeline OR requests an immediate call.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "email": {"type": "string", "description": "Customer email"},
                            "name": {"type": "string", "description": "Customer name"},
                            "phone": {"type": "string", "description": "Customer phone"},
                            "urgency": {
                                "type": "string",
                                "enum": ["immediate", "later"],
                                "description": "Set to 'immediate' if user explicitly asks for a call NOW."
                            }
                        },
                        "required": ["email"]
                    }
                }
            }
        ]
        
        logging.info(f"🔨 [BUILD_TOOLS] Built {len(tools)} tools: {[t['function']['name'] for t in tools]}")
        logging.info(f"🔨 [BUILD_TOOLS] Returning tools (type={type(tools)}, len={len(tools)})")
        return tools
    
    async def _handle_function_call(
        self,
        func_name: str,
        func_args: Dict,
        chatbot_id: str,
        user_id: str,
        user_email: str,
        conversation_id: str
    ) -> Dict:
        """
        Handle Gemini function calls.
        SAME LOGIC as standard_rag_controller.py
        """
        print(f"TOOL CALL DETECTED: {func_name}")
        print(f"ARGUMENTS: {func_args}")
        
        tool_result = {"status": "error", "message": "Unknown tool"}
        
        if func_name == "submit_pre_chat_form":
            try:
                # Get email (mapped from 'email' if exists, or user_email)
                email_arg = func_args.get("email") or user_email
                
                # --- STRICT VALIDATION ---
                is_valid, err_msg = GCSStandardRAGController._validate_email_arg(email_arg)
                if not is_valid:
                    logging.warning(f"[GCS] Blocked Fake Email in submit_form: {email_arg}")
                    return {"status": "error", "message": err_msg}
                
                email_to_save = email_arg
                
                # Get chatbot organization_id
                conn = postgres_connection()
                org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
                org_result = run_query(conn, org_query, (chatbot_id,))
                conn.close()
                
                if org_result and org_result[0]:
                    custom_data = {
                        "name": func_args.get("name", ""),
                        "phone": func_args.get("phone", ""),
                        "source": "chatbot",
                        "chatbot_id": chatbot_id
                    }
                    
                    success = save_customer(chatbot_id, email_to_save, custom_data)
                    
                    if success:
                        if conversation_id and email_to_save:
                            update_conversation_email(conversation_id, email_to_save)
                        tool_result = {"status": "success", "message": "Data processed. Continue conversation."}
                    else:
                        tool_result = {"status": "error", "message": "Failed to save data."}
                else:
                    print(f"⚠️ Organization not found for chatbot {chatbot_id}")
                    tool_result = {"status": "success", "message": "Ack."}
                    
            except Exception as e:
                print(f"❌ Error submitting form: {e}")
                tool_result = {"status": "error", "message": "Form submission failed."}
                
        elif func_name == "handoff_to_support":
            try:
                email_arg = func_args.get("email") or user_email
                name_arg = func_args.get("name")
                phone_arg = func_args.get("phone")
                urgency_arg = func_args.get("urgency")
                
                # --- STRICT VALIDATION ---
                is_valid, err_msg = GCSStandardRAGController._validate_email_arg(email_arg)
                if not is_valid:
                    logging.warning(f"[GCS] Blocked Fake Email in handoff: {email_arg}")
                    return {"status": "error", "message": err_msg}
                
                if email_arg:
                    # 1. Update/Save Customer Data
                    if name_arg or phone_arg:
                        c_data = {
                            "name": name_arg,
                            "phone": phone_arg,
                            "source": "chatbot",
                            "chatbot_id": chatbot_id
                        }
                        save_customer(chatbot_id, email_arg, c_data)
                    
                    # 2. Handle Urgency
                    if urgency_arg == 'immediate':
                        title = f"Urgent Callback: {name_arg or email_arg}"
                        message = f"User has requested an immediate callback via GCS chat. Phone: {phone_arg or 'N/A'}"
                        data = {
                            "email": email_arg,
                            "phone": phone_arg,
                            "name": name_arg,
                            "chatbot_id": chatbot_id,
                            "user_id": user_id
                        }
                        create_notification(chatbot_id, "call", title, message, data)
                        tool_result = {"status": "success", "message": "Immediate callback requested. Team notified!"}
                    else:
                        # 3. Move to Pipeline (Schedule/Later)
                        with get_db_connection() as conn:
                            success = move_customer_to_pipeline(chatbot_id, email_arg, conn)
                        
                        if success:
                            create_notification(
                                chatbot_id,
                                "call",
                                "Support Request (Pipeline)",
                                f"{name_arg or email_arg} added to support pipeline.",
                                {"email": email_arg, "name": name_arg, "phone": phone_arg}
                            )
                            tool_result = {"status": "success", "message": "Handoff complete. Customer moved to priority queue."}
                        else:
                            tool_result = {"status": "error", "message": "Handoff failed (pipeline not found or user missing)."}
                else:
                    tool_result = {"status": "error", "message": "Email is required. Please ask the user for their email."}
                    
            except Exception as e:
                print(f"❌ Handoff Error: {e}")
                logging.error(f"Handoff Error: {e}")
                tool_result = {"status": "error", "message": "Server error during handoff."}
        
        return tool_result
    
    @staticmethod
    async def chat_stream(
        chatbot_id: str,
        user_id: str,
        prompt: str,
        conversation_id: str = None,
        user_email: str = None,
        user_plan: str = None
    ):
        """
        Manages the chat using Gemini with SAME FEATURES as OpenAI version:
        - Vector search context
        - Industry-specific prompts
        - Conversation history
        - Progressive form collection
        - Wait 3 turns rule
        - Heavy intent triggers
        - Returning user detection
        - Function calling (submit_pre_chat_form, handoff_to_support)
        - Recursive call after tool execution
        """
        logging.info(f"🔥 [GCS START] chat_stream called - chatbot={chatbot_id}, user={user_id}, email={user_email}")
        controller = GCSStandardRAGController()
        
        # Validation: Check if chatbot exists
        try:
            with get_db_connection() as conn:
                check_query = "SELECT 1 FROM chatbots WHERE chatbot_id = %s"
                res = run_query(conn, check_query, (chatbot_id,))
                if not res:
                    yield f"data: {json.dumps({'error': 'Invalid Chatbot ID'})}\n\n"
                    return
        except Exception as e:
            logging.error(f"Error validating chatbot_id: {e}")
            yield f"data: {json.dumps({'error': 'Database connection error during validation'})}\n\n"
            return
        
        start_time = time.time()
        
        # 1. Embed Prompt & Retrieve Context (Uses OpenAI embeddings - SHARED)
        t0 = time.time()
        query_vector = embedding_service.embed_text(prompt)
        t1 = time.time()
        print(f"DEBUG [GCS]: Embedding Time: {t1 - t0:.4f}s")
        
        context_results = await asyncio.to_thread(search_vectors, chatbot_id, query_vector, limit=1)
        t2 = time.time()
        print(f"DEBUG [GCS]: Vector Search Time: {t2 - t1:.4f}s")
        
        if context_results:
            context_text = "\n\n".join([f"[CHUNK]: {r['content']}" for r in context_results])
        else:
            context_text = "No knowledge base available."
        
        print(f"RAG Context [GCS] (Vector Search): {context_text[:100]}...")
        
        # 2. Construct System Instruction (Base) - SAME AS OpenAI
        org_type = controller.get_organization_type(chatbot_id)
        industry_instruction = INDUSTRY_PROMPTS.get(org_type, INDUSTRY_PROMPTS.get("Default", ""))
        
        system_instruction = (
            f"Persona/Industry Context: {industry_instruction}\n\n"
            "Source Knowledge (Vector DB Context):\n"
            f"{context_text}\n\n"
            "Instruction: Answer the user's question using the Source Knowledge provided above.\n"
            "IMPORTANT EXCEPTION: If the user asks about PRICING, COST, BUYING, or SUPPORT, do NOT answer from the context. Instead, start Lead Capture immediately.\n"
            "STYLE: Be helpful but concise. Keep answers to 2-4 sentences.\n"
            "Default Rule: If info is not found, state it politely. But if it's a Pricing/Support question, IGNORE missing info and ask for their Name."
        )
        
        # 2.5. Check for Pre-Chat Form (Function Calling)
        form_config = get_pre_chat_form(chatbot_id)
        logging.info(f"📋 [FORM_CONFIG] Retrieved: {len(form_config) if form_config else 0} fields")
        
        logging.info("🔧 [CALLING] _build_tools...")
        tools = controller._build_tools(form_config)
        logging.info(f"🔧 [RETURNED] tools = {tools}")
        logging.info(f"🔧 [TYPE_CHECK] tools is None? {tools is None}, tools type: {type(tools)}")
        if tools:
            logging.info(f"🔧 [TOOLS_BUILT] {len(tools)} tools: {[t.get('function', {}).get('name') for t in tools]}")
        else:
            logging.error("🔧 [ERROR] Tools is None or empty! This will break tool calling!")
        
        # Build field descriptions for prompts (excluding standard ones)
        fields_str = ""
        if form_config:
            field_descriptions = []
            for f in form_config:
                f_id = f.get("id", "unknown")
                if f_id in ["name", "email", "phone"]:
                    continue
                f_label = f.get("label", f_id)
                field_descriptions.append(f"- {f_label}")
            if field_descriptions:
                fields_str = "Also ask for: " + ", ".join(field_descriptions)
        
        # 3. Manage Thread/Conversation - SAME AS OpenAI
        history_messages = []
        is_new_thread = False
        is_returning_user = False
        customer_data = None
        form_system_instruction = ""
        
        try:
            with get_db_connection() as conn:
                # 3a. Resolve User Identity if missing
                if conversation_id and not user_email:
                    meta = get_conversation_metadata(conversation_id, conn)
                    if meta and meta.get("user_email"):
                        user_email = meta.get("user_email")
                        print(f"✅ [GCS] Resolved User Email from Conversation: {user_email}")
                
                if not conversation_id or conversation_id == "NEW_CHAT":
                    conversation_id = str(uuid.uuid4())
                    is_new_thread = True
                    yield f"data: {json.dumps({'event': 'thread_created', 'thread_id': conversation_id})}\n\n"
                else:
                    # Fetch History
                    try:
                        hist_query = "SELECT history FROM bot_conversations WHERE conversation_id = %s"
                        rows = run_query(conn, hist_query, (conversation_id,))
                        if rows and rows[0][0]:
                            raw_history = rows[0][0]
                            
                            if isinstance(raw_history, str):
                                try:
                                    raw_history = json.loads(raw_history)
                                except:
                                    raw_history = []
                            
                            if isinstance(raw_history, list):
                                recent_history = raw_history[-100:] if len(raw_history) > 100 else raw_history
                                
                                for msg in recent_history:
                                    if isinstance(msg, dict):
                                        role = "assistant" if msg.get("role") == "bot" else "user"
                                        content = msg.get("text", "")
                                        if content:
                                            history_messages.append({"role": role, "content": content})
                                
                                logging.info(f"[GCS] Loaded {len(history_messages)} history messages for {conversation_id}")
                    except Exception as e:
                        logging.error(f"[GCS] Error fetching history: {e}")
                
                # 4. Detect Returning User and Build Form Instruction
                # 4a. Returning User Check (Has Email)  
                if user_email and user_email != "" and "guest" not in user_email.lower():
                    # Fetch customer data
                    customer_context_str = ""
                    try:
                        cust = get_customer_by_email(chatbot_id, user_email, conn)
                        if cust:
                            customer_data = cust
                            c_name = cust.get("name")
                            c_phone = cust.get("phone")
                            
                            # Check if we have ALL details - then returning user
                            if c_name and c_phone:
                                is_returning_user = True
                                customer_context_str += f"Name: {c_name}\n"
                                customer_context_str += f"IMPORTANT: Address the user by their name ({c_name}) occasionally to be friendly.\n"
                                customer_context_str += f"Phone: {c_phone}\n"
                                
                                form_system_instruction = (
                                    f"\n\n[USER CONTEXT]\n"
                                    f"You are speaking with a RETURNING USER: {user_email}\n"
                                    f"{customer_context_str}"
                                    f"You have their details, so do NOT ask for Name/Email/Phone.\n"
                                )
                                # Remove submit_pre_chat_form for returning users
                                if tools:
                                    tools = [t for t in tools if t['function']['name'] != 'submit_pre_chat_form']
                            else:
                                # Has email but missing name or phone
                                if c_name:
                                    customer_context_str += f"Name: {c_name}\n"
                                if c_phone:
                                    customer_context_str += f"Phone: {c_phone}\n"
                                    
                                form_system_instruction = (
                                    f"\n\n[USER CONTEXT]\n"
                                    f"You are speaking with a user whose email is: {user_email}.\n"
                                    f"{customer_context_str}"
                                    f"Since you already have their email, do NOT ask for it again.\n"
                                    f"However, if you do not have their Name or Phone in the context above, please ask for those politely after 3 turns.\n"
                                )
                    except Exception as e:
                        logging.error(f"Error fetching customer context: {e}")
                else:
                    # No email - new user - EXACT STANDARD RAG LOGIC
                    form_system_instruction = (
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
                
                # Add support handoff instruction - EXACT STANDARD RAG VERSION
                form_system_instruction += (
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
                    
        except Exception as e:
            logging.error(f"[GCS] Error in chat setup: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        
        # 5. Call Gemini (Chat Completion)
        full_response = ""
        function_call_detected = None
        
        try:
            # Construct full system prompt
            full_system_prompt = f"{system_instruction}{form_system_instruction}"
            
            # Build messages for Gemini
            messages = []
            for msg in history_messages:
                messages.append(msg)
            messages.append({"role": "user", "content": prompt})
            
            t_llm_start = time.time()
            
            # CRITICAL DEBUG: Log tool status
            logging.info(f"[GCS CRITICAL] Tools being passed to Gemini: {len(tools) if tools else 0} tools")
            if tools:
                logging.info(f"[GCS CRITICAL] First tool: {tools[0].get('function', {}).get('name', 'UNKNOWN')}")
            else:
                logging.warning("[GCS CRITICAL] NO TOOLS! Tools list is None or empty!")
            
            # Stream response from Gemini
            response = gcs_services.chat_stream(
                messages=messages,
                system_instruction=full_system_prompt,
                tools=tools
            )
            
            async for chunk in response:
                # Handle function calls and text content
                if hasattr(chunk, 'candidates') and chunk.candidates:
                    candidate = chunk.candidates[0]
                    if hasattr(candidate, 'content') and candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            # Check for function call
                            if hasattr(part, 'function_call') and part.function_call:
                                function_call_detected = part.function_call
                            # Check for text
                            elif hasattr(part, 'text') and part.text:
                                full_response += part.text
                                yield f"data: {json.dumps({'token': part.text})}\n\n"
            
            t_llm_end = time.time()
            print(f"DEBUG [GCS]: LLM Generation Time: {t_llm_end - t_llm_start:.4f}s")
            
            # Handle function call if detected (RECURSIVE CALL like OpenAI version)
            if function_call_detected:
                func_name = function_call_detected.name
                func_args = {}
                
                if hasattr(function_call_detected, 'args') and function_call_detected.args:
                    func_args = dict(function_call_detected.args)
                
                # Execute the tool
                tool_result = await controller._handle_function_call(
                    func_name, func_args, chatbot_id, user_id, user_email, conversation_id
                )
                
                print(f"DEBUG [GCS]: Tool Result: {tool_result}")
                
                # RECURSIVE CALL: Continue generation after tool execution
                print("DEBUG [GCS]: Recursive Call to Answer Question...")
                
                # Build follow-up messages with tool result
                follow_up_messages = messages.copy()
                follow_up_messages.append({
                    "role": "assistant",
                    "content": f"[Tool '{func_name}' returned: {tool_result['message']}]"
                })
                
                # Get continuation response (without tools to avoid loops)
                continuation = gcs_services.chat_stream(
                    messages=follow_up_messages,
                    system_instruction=full_system_prompt,
                    tools=None
                )
                
                async for chunk in continuation:
                    if hasattr(chunk, 'candidates') and chunk.candidates:
                        candidate = chunk.candidates[0]
                        if hasattr(candidate, 'content') and candidate.content and candidate.content.parts:
                            for part in candidate.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    full_response += part.text
                                    yield f"data: {json.dumps({'token': part.text})}\n\n"
            
            yield f"data: {json.dumps({'event': 'end'})}\n\n"
            
        except Exception as e:
            logging.error(f"[GCS] Gemini Error: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        
        # 6. Save to DB (History) - SAME AS OpenAI
        try:
            current_time = datetime.now(timezone.utc)
            new_msgs = [
                {"role": "user", "text": prompt, "timestamp": current_time.isoformat()},
                {"role": "bot", "text": full_response, "timestamp": current_time.isoformat()}
            ]
            
            with get_db_connection() as conn:
                if is_new_thread:
                    # Generate title with Gemini
                    title = await gcs_services.generate_title(prompt)
                    
                    insert_query = """
                        INSERT INTO bot_conversations (user_id, user_email, user_plan, chatbot_id, conversation_id, title, history, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                    """
                    safe_user_id = user_id or "guest"
                    safe_email = user_email or (safe_user_id if '@' in safe_user_id else 'guest@example.com')
                    safe_plan = user_plan or "free"
                    
                    run_write_query(conn, insert_query, (
                        safe_user_id, safe_email, safe_plan, chatbot_id,
                        conversation_id, title, json.dumps(new_msgs), current_time, current_time
                    ))
                else:
                    update_query = """
                        UPDATE bot_conversations 
                        SET history = COALESCE(history, '[]'::jsonb) || %s::jsonb, updated_at = %s
                        WHERE conversation_id = %s
                    """
                    run_write_query(conn, update_query, (json.dumps(new_msgs), current_time, conversation_id))
                    
        except Exception as e:
            logging.error(f"[GCS] Error saving history: {e}")


# Singleton instance
gcs_standard_rag_controller = GCSStandardRAGController()
