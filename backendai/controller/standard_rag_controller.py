import logging
import asyncio
import json
import os
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import HTTPException
from services.openai_services import client
from services.embedding_service import embedding_service
from DB.postgresDB import postgres_connection, run_query, run_write_query, search_vectors
from controller.chatbot_config import get_sitemap_urls, get_url_data, pdf_data, doc_data, txt_data, ppt_data, image_data
from DB.postgresDB import postgres_connection, run_query, run_write_query, search_vectors, get_db_connection
from resources.industry_prompts import INDUSTRY_PROMPTS

# Use the environment variable for S3 Base URL
S3_BASE_URL = os.getenv("S3_BASE_URL", "")

class StandardRAGController:
    @staticmethod
    async def fetch_and_prepare_data(chatbot_id: str) -> str:
        """
        Fetches data from 'automations' table and extracts clean text.
        """
        conn = await asyncio.to_thread(postgres_connection)
        if not conn:
            raise Exception("Database connection failed")

        data_query = """
            SELECT a.training_url, a.training_pdf, a.training_article
            FROM automations a
            JOIN chatbots c ON a.organization_id = c.organization_id
            WHERE c.chatbot_id = %s;
        """
        result = await asyncio.to_thread(run_query, conn, data_query, (chatbot_id,))
        conn.close()

        if not result:
            return ""

        combined_text = ""
        for url_data, file_data, article_data in result:
             # URL data
            if url_data:
                for url_item in url_data:
                    try:
                        if url_item.get("sitemap"):
                        # Sitemap-based scraping
                            sitemap_urls = get_sitemap_urls(url_item["url"])

                            for page_url in sitemap_urls:
                                try:
                                    content = get_url_data(page_url)
                                    if content:
                                        combined_text += (
                                            f"\n\n--- Source: {page_url} ---\n{content}"
                                        )
                                except Exception as e:
                                    logging.error(f"Error scraping {page_url}: {e}")

                            else:
                                # Single-page scraping
                                try:
                                    content = get_url_data(url_item["url"])
                                    if content:
                                        combined_text += (
                                            f"\n\n--- Source: {url_item['url']} ---\n{content}"
                                        )
                                except Exception as e:
                                    logging.error(f"Error fetching URL {url_item['url']}: {e}")

                    except Exception as e:
                        logging.error(f"Error fetching URL {url_item.get('url')}: {e}")

            # File data
            if file_data:
                for file_item in file_data:
                    s3_name = file_item.get('s3Name')
                    if s3_name:
                        file_url = f"{S3_BASE_URL}/{s3_name}"
                        _, ext = os.path.splitext(file_url.lower())
                        try:
                            content = ""
                            if ext == '.pdf':
                                content = pdf_data(file_url)
                            elif ext in ['.doc', '.docx']:
                                content = doc_data(file_url)
                            elif ext == '.txt':
                                content = txt_data(file_url)
                            elif ext in ['.ppt', '.pptx']:
                                content = ppt_data(file_url)
                            elif ext in ['.jpeg', '.jpg', '.png']:
                                content = image_data(file_url)
                            
                            if content:
                                combined_text += f"\n\n--- Source: {s3_name} ---\n{content}"
                        except Exception as e:
                            logging.error(f"Error processing file {file_url}: {e}")

            # Article data
            if article_data:
                for article in article_data:
                    content = article.get('content', '')
                    if content:
                        combined_text += f"\n\n--- Source: Article ---\n{content}"

        return combined_text

    @staticmethod
    async def get_stored_knowledge(chatbot_id: str) -> str:
        """
        Retrieves the processed text content straight from the Vector DB (training_chunks).
        This is used by Realtime API to inject context instantly.
        Since we now have chunks, we fetch them ordered by index and concatenate.
        We fetch up to 500 chunks (approx 400k chars ~ 100k tokens) to maximize context 
        without exceeding the 128k token limit of the model.
        """
        conn = postgres_connection()
        try:
            # Fetch chunks ordered by index
            # Limit 500 chunks * 800 chars = 400,000 chars
            query = "SELECT content FROM training_chunks WHERE chatbot_id = %s ORDER BY chunk_index ASC LIMIT 500;"
            result = run_query(conn, query, (chatbot_id,))
            
            if result:
                # Concatenate
                full_text = "\n\n".join([r[0] for r in result])
                return full_text
                
            return ""
        except Exception as e:
            logging.error(f"Error getting stored knowledge: {e}")
            return ""
        finally:
            conn.close()

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
        """
        Splits text into chunks of roughly chunk_size characters with overlap.
        """
        if not text:
            return []
        
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
            
        return chunks

    @staticmethod
    async def ingest_to_vector_db(chatbot_id: str):
        """
        1. Fetches Text.
        2. Chunks Text.
        3. Embeds Chunks (Batch).
        4. Replaces old chunks in training_chunks table.
        """
        from DB.postgresDB import delete_chunks, insert_chunk_batch
        
        logging.info(f"🔄 Step 1/4: Fetching training data for chatbot {chatbot_id}")
        text_data = await StandardRAGController.fetch_and_prepare_data(chatbot_id)
        if not text_data:
            raise Exception("No training data found for this chatbot.")
        
        logging.info(f"✅ Fetched {len(text_data)} characters of training data")
        
        # 1. Chunking
        logging.info(f"🔄 Step 2/4: Chunking text data...")
        chunks_text = StandardRAGController.chunk_text(text_data)
        logging.info(f"✅ Generated {len(chunks_text)} chunks for chatbot {chatbot_id}")
        
        # 2. Embedding (Batch)
        # We process in small batches of 20 to avoid rate limits if needed, 
        # but OpenAI handles list inputs well.
        logging.info(f"🔄 Step 3/4: Generating embeddings for {len(chunks_text)} chunks...")
        chunks_data = []
        
        # We need a robust embed function. Since embedding_service.embed_text currently takes str, 
        # let's map it or update it. For now, calling it in loop or we update service.
        # Let's call in loop for simplicity first, or update service? 
        # Updating service is better for performance.
        # I will assume I updated embedding_service.embed_batch(list) in next step.
        # But to keep this tool safe, I will stick to single embed in loop for now OR generic list if supported.
        # Check: embedding_service.embed_text currently only takes string. 
        # I must fix that first. I will do loop here for specific reliability now.
        
        for i, chunk in enumerate(chunks_text):
            if (i + 1) % 10 == 0:  # Log progress every 10 chunks
                logging.info(f"   Embedded {i + 1}/{len(chunks_text)} chunks...")
            vector = embedding_service.embed_text(chunk) 
            if vector:
                chunks_data.append({
                    "index": i,
                    "content": chunk,
                    "embedding": vector
                })
        
        logging.info(f"✅ Generated embeddings for {len(chunks_data)} chunks")
        
        # 3. Replace Data
        logging.info(f"🔄 Step 4/4: Saving embeddings to database...")
        # Use Thread for DB Ops
        await asyncio.to_thread(delete_chunks, chatbot_id)
        
        if chunks_data:
            await asyncio.to_thread(insert_chunk_batch, chatbot_id, chunks_data)
        
        logging.info(f"✅ Successfully saved {len(chunks_data)} chunks to database for chatbot {chatbot_id}")
        
        return True

    @staticmethod
    def get_organization_type(chatbot_id: str) -> str:
        """
        Fetches the organization type for a given chatbot.
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
    async def chat_stream(chatbot_id: str, user_id: str, prompt: str, conversation_id: str = None, user_email: str = None, user_plan: str = None):
        """
        Manages the chat using Custom RAG (Direct Context + History -> Chat Completion).
        Optimized for Speed: No prompt embedding, uses gpt-4o-mini.
        """


        
        import time
        start_time = time.time()
        
        # 1. Embed Prompt & Retrieve Context (Vector Search)
        t0 = time.time()
        query_vector = embedding_service.embed_text(prompt)
        t1 = time.time()
        print(f"DEBUG: Embedding Time: {t1 - t0:.4f}s")
        
        context_results = await asyncio.to_thread(search_vectors, chatbot_id, query_vector, limit=1)
        t2 = time.time()
        print(f"DEBUG: Vector Search Time: {t2 - t1:.4f}s")
        
        if context_results:
             # Concatenate retrieved chunks with visual separators
             context_text = "\n\n".join([f"[CHUNK]: {r['content']}" for r in context_results])
        else:
             context_text = "No knowledge base available."

        print(f"RAG Context (Vector Search): {context_text[:100]}...")

        # 2. Construct System Instruction (Base)
        
        # Determine Organization Type and get Industry Instruction
        org_type = StandardRAGController.get_organization_type(chatbot_id)
        # Determine Organization Type and get Industry Instruction
        org_type = StandardRAGController.get_organization_type(chatbot_id)
        industry_instruction = INDUSTRY_PROMPTS.get(org_type, INDUSTRY_PROMPTS["Default"])
        
        system_instruction = (
            f"{industry_instruction}\n\n"
            "Use the following pieces of retrieved context to answer the user's question.\n"
            "If the answer is not in the context, say you don't know, but answer politely based on your persona.\n"
            "Keep answers concise and relevant."
            "\n"
            f"Context:\n{context_text}"
        )

        # 2.5. Check for Pre-Chat Form (Function Calling)
        from DB.postgresDB import get_pre_chat_form
        form_config = get_pre_chat_form(chatbot_id)
        
        tools = None
        tool_choice = None
        
        if form_config:
            # Generate Tool Definition from Form Config
            # e.g. [{"id": "email", "type": "email", "required": true, ...}]
            properties = {}
            required_fields = []
            print(form_config)
            
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
                tools = [{
                    "type": "function",
                    "function": {
                        "name": "submit_pre_chat_form",
                        "description": "Submit user form data when they provide it.",
                        "parameters": {
                            "type": "object",
                            "properties": properties,
                            "required": required_fields
                        }
                    }
                }]
                tool_choice = "auto"
                
                # Append to System Instruction
                field_descriptions = []
                for f_id, f_prop in properties.items():
                    field_descriptions.append(f"- {f_prop['description']} (internal_id: {f_id})")
                
                fields_str = "\n".join(field_descriptions)
                
                # Updated system instruction - wait 4-6 messages before asking for details
                system_instruction += (
                    f"\n\n[PROGRESSIVE FORM COLLECTION]\n"
                    f"First, engage naturally with the user. Answer their questions helpfully for 4-6 conversation turns.\n"
                    f"After 4-6 turns, you must collect: Name, Email, and Phone Number.\n"
                    f"CRITICAL: Ask for these details ONE BY ONE. Do NOT ask for all three at once.\n"
                    f"1. Ask for the Name. Wait for answer.\n"
                    f"2. Ask for the Email. Wait for answer.\n"
                    f"3. Ask for the Phone Number. Wait for answer.\n"
                    f"Once you have all three values (name, email, phone), call the 'submit_pre_chat_form' function immediately.\n"
                    f"After calling the function, do NOT tell the user 'I have saved your details'. Just say 'Thanks!' or 'Got it!' and continue the conversation naturally."
                )

        # 3. Manage Thread/Conversation
        # Use Context Manager to automatically get/release pool connection
        import traceback
        from DB.postgresDB import get_db_connection
        
        history_messages = []
        is_new_thread = False
        
        try:
            with get_db_connection() as conn:
                if not conversation_id or conversation_id == "NEW_CHAT":
                     import uuid
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
                                 # Safety limit 100
                                 recent_history = raw_history[-100:] if len(raw_history) > 100 else raw_history
                                 
                                 for msg in recent_history:
                                     if isinstance(msg, dict):
                                         role = "assistant" if msg.get("role") == "bot" else "user"
                                         content = msg.get("text", "")
                                         if content:
                                             history_messages.append({"role": role, "content": content})
                             
                             logging.info(f"Loaded {len(history_messages)} history messages for {conversation_id}")
                     except Exception as e:
                         logging.error(f"Error fetching history: {e}")

                # Separate Form Instruction to inject it closer to User Prompt for stronger adherence
                form_system_instruction = ""
                conversation_turn_count = len(history_messages) // 2  # Count user-bot exchanges
                
                if form_config and fields_str:
                     if conversation_turn_count >= 4:
                          # After 4-6 turns, start asking for details
                          form_system_instruction = (
                             f"\n\n[SYSTEM INTERVENTION - DETECT & COLLECT USER DETAILS]"
                             f"\nYou have had {conversation_turn_count} conversation turns with the user."
                             f"\nNow is the time to collect: Name, Email, and Phone Number."
                             f"\nLOGIC FLOW:"
                             f"\n1. REVIEW what you have already collected from previous messages."
                             f"\n2. IF you have Name, Email, AND Phone, call 'submit_pre_chat_form' IMMEDIATELY."
                             f"\n3. IF YOU ARE MISSING ANY, ASK FOR ONE MISSING ITEM ONLY."
                             f"\n   - If missing Name: 'May I know your name?'"
                             f"\n   - If missing Email: 'Thanks! What is your email address?'"
                             f"\n   - If missing Phone: 'And your phone number?'"
                             f"\n4. Do NOT ask for all three at once."
                             f"\n5. Do NOT say 'I will save this' or 'details saved'."
                          )
                     else:
                          # Before 4 turns, just answer naturally
                          form_system_instruction = (
                             f"\n\n[SYSTEM INTERVENTION - EARLY CONVERSATION]"
                             f"\nYou are in turn {conversation_turn_count + 1} of the conversation."
                             f"\nFocus on answering the user's questions helpfully."
                             f"\nDo NOT ask for name, email, or phone number yet."
                          )

                messages = [{"role": "system", "content": system_instruction}]
                messages.extend(history_messages)
                
                # Injection: Prepend strict instruction to the final user prompt
                final_user_content = prompt
                if form_system_instruction:
                    final_user_content = f"{form_system_instruction}\n\nUser says: {prompt}"
                
                messages.append({"role": "user", "content": final_user_content})
                
                # Debug Print
                # print(f"DEBUG: Final User Message: {final_user_content}")
                
                print(f"DEBUG: Tools Count: {len(tools) if tools else 0}")
                if tools:
                    print(f"DEBUG: First Tool: {tools[0]['function']['name']}")
                    # print(f"DEBUG: System Prompt: {system_instruction}")
                
        except Exception as e:
             logging.error(f"Error in chat setup: {e}")
             yield f"data: {json.dumps({'error': str(e)})}\n\n"
             return

        # 5. Call OpenAI (Chat Completion) - Connection RELEASED here
        full_response = ""
        tool_call_buffer = [] 
        
        try:
            t_llm_start = time.time()
            
            # Prepare args
            api_args = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "stream": True,
                "temperature": 0.7
            }
            if tools:
                api_args["tools"] = tools
                api_args["tool_choice"] = tool_choice
            
            stream = client.chat.completions.create(**api_args)
            
            for chunk in stream:
                # Handle Tool Calls
                if chunk.choices[0].delta.tool_calls:
                    for tc in chunk.choices[0].delta.tool_calls:
                        if len(tool_call_buffer) <= tc.index:
                            tool_call_buffer.append({"id": tc.id, "name": tc.function.name, "arguments": ""})
                        if tc.function.arguments:
                            tool_call_buffer[tc.index]["arguments"] += tc.function.arguments
                
                # Handle Text Content
                elif chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield f"data: {json.dumps({'token': token})}\n\n"
            
            t_llm_end = time.time()
            print(f"DEBUG: LLM Generation Time: {t_llm_end - t_llm_start:.4f}s")
            
            # If Tools were called, process them AND Continue generation
            if tool_call_buffer:
                # 1. Add Assistant Tool Call Message to History
                assistant_tool_msg = {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {"name": tc["name"], "arguments": tc["arguments"]}
                        }
                        for tc in tool_call_buffer
                    ]
                }
                messages.append(assistant_tool_msg)
                
                for tc in tool_call_buffer:
                    print(f"TOOL CALL DETECTED: {tc['name']}")
                    print(f"ARGUMENTS: {tc['arguments']}") 
                    
                    # Save to CRM via rtserver (using existing customers endpoint)
                    try:
                        import requests
                        form_data = json.loads(tc['arguments'])
                        rtserver_url = os.getenv("RTSERVER_URL", "http://localhost:3000")
                        
                        # Get chatbot organization_id
                        conn = postgres_connection()
                        org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
                        org_result = run_query(conn, org_query, (chatbot_id,))
                        conn.close()
                        
                        if org_result and org_result[0]:
                            org_id = org_result[0][0]
                            
                            # Save to customers table with custom_data
                            crm_payload = {
                                "organization_id": org_id,
                                "email": form_data.get("email", ""),
                                "custom_data": {
                                    "name": form_data.get("name", ""),
                                    "phone": form_data.get("phone", ""),
                                    "source": "chatbot",
                                    "chatbot_id": chatbot_id
                                }
                            }
                            
                            print(f"DEBUG CRM PAYLOAD: {json.dumps(crm_payload, indent=2)}")
                            
                            # Save to customers table - check if exists first
                            conn = postgres_connection()
                            
                            # Check if customer already exists
                            check_query = "SELECT id FROM customers WHERE organization_id = %s AND email = %s"
                            existing = run_query(conn, check_query, (org_id, crm_payload["email"]))
                            
                            if existing and existing[0]:
                                # Update existing customer
                                update_query = """
                                    UPDATE customers 
                                    SET custom_data = %s, updated_at = NOW()
                                    WHERE organization_id = %s AND email = %s
                                    RETURNING id
                                """
                                result = run_write_query(conn, update_query, (
                                    json.dumps(crm_payload["custom_data"]),
                                    org_id,
                                    crm_payload["email"]
                                ))
                                print(f"✅ Customer updated: {form_data.get('email')}")
                            else:
                                # Insert new customer
                                insert_query = """
                                    INSERT INTO customers (organization_id, email, custom_data, created_at, updated_at)
                                    VALUES (%s, %s, %s, NOW(), NOW())
                                    RETURNING id
                                """
                                result = run_write_query(conn, insert_query, (
                                    org_id,
                                    crm_payload["email"],
                                    json.dumps(crm_payload["custom_data"])
                                ))
                                print(f"✅ Customer created: {form_data.get('email')}")
                            
                            conn.close()
                            # Internal message only - bots should not parrot this
                            tool_result = {"status": "success", "message": "Data processed. Continue conversation."}
                        else:
                            print(f"⚠️ Organization not found for chatbot {chatbot_id}")
                            tool_result = {"status": "success", "message": "Ack."}
                            
                    except Exception as crm_error:
                        print(f"❌ CRM save error: {crm_error}")
                        tool_result = {"status": "success", "message": "Ack."}
                    
                    # 2. Add Tool Output Message to History
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(tool_result)
                    })
                
                # 3. Don't send "Thank you" message - let the bot respond naturally
                # The recursive call below will generate the appropriate response
                
                # 4. RECURSIVE CALL: Continue checking if there's an answer needed
                # We remove tools from next call to avoid loops (unless we want multi-step tools)
                # But here we just want to answer the user's question.
                # Remove 'tools' from args? Or keep them? Keeping them is fine, but safer to remove if we are done.
                # Let's keep them, standard behavior.
                
                print("DEBUG: Recursive Call to Answer Question...")
                api_args["messages"] = messages
                stream_2 = client.chat.completions.create(**api_args)
                
                for chunk in stream_2:
                    if chunk.choices[0].delta.content:
                        token = chunk.choices[0].delta.content
                        full_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

            yield f"data: {json.dumps({'event': 'end'})}\n\n"
            
        except Exception as e:
            logging.error(f"OpenAI Error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
            
        # 6. Save to DB (History) - Get connection AGAIN
        try:
            current_time = datetime.now(timezone.utc)
            new_msgs = [
                {"role": "user", "text": prompt, "timestamp": current_time.isoformat()},
                {"role": "bot", "text": full_response, "timestamp": current_time.isoformat()}
            ]
            
            with get_db_connection() as conn:
                if is_new_thread:
                     # Generate title from first prompt (max 50 chars)
                     title = prompt[:50] + "..." if len(prompt) > 50 else prompt
                     
                     insert_query = """
                        INSERT INTO bot_conversations (user_id, user_email, user_plan, chatbot_id, conversation_id, title, history, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                     """
                     safe_user_id = user_id or "guest"
                     safe_email = user_email or (safe_user_id if '@' in safe_user_id else 'guest@example.com')
                     safe_plan = user_plan or "free"
                     
                     run_write_query(conn, insert_query, (safe_user_id, safe_email, safe_plan, chatbot_id, conversation_id, title, json.dumps(new_msgs), current_time, current_time))
                else:
                     update_query = """
                        UPDATE bot_conversations 
                        SET history = COALESCE(history, '[]'::jsonb) || %s::jsonb, updated_at = %s
                        WHERE conversation_id = %s
                     """
                     run_write_query(conn, update_query, (json.dumps(new_msgs), current_time, conversation_id))
                     
        except Exception as e:
            logging.error(f"Error saving history: {e}")

standard_rag_controller = StandardRAGController()
