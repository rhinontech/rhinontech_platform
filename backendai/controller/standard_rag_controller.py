import logging
import asyncio
import json
import os
import time
import requests
import traceback
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import HTTPException
from services.openai_services import client
from services.embedding_service import embedding_service
from DB.postgresDB import (
    postgres_connection, 
    run_query, 
    run_write_query, 
    search_vectors, 
    get_db_connection, 
    delete_chunks, 
    insert_chunk_batch,
    save_bot_message,
    init_vector_db, 
    get_pre_chat_form,
    get_customer_by_email,
    move_customer_to_pipeline,
    save_customer, 
    get_conversation_metadata, 
    update_conversation_email,
    create_notification
)
from controller.chatbot_config import get_sitemap_urls, get_url_data, pdf_data, doc_data, txt_data, ppt_data, image_data
from resources.industry_prompts import INDUSTRY_PROMPTS

# Use the environment variable for S3 Base URL
S3_BASE_URL = os.getenv("S3_BASE_URL", "")
S3_FOLDER_NAME = os.getenv("S3_FOLDER_NAME", "")

class StandardRAGController:
    @staticmethod
    async def fetch_and_prepare_data(chatbot_id: str) -> str:
        """
        Fetches data from 'automations' table and extracts clean text.
        """
        try:
            # properly use context manager via helper or direct release
            # Since this is async/threaded, we can't easily use the context manager inside asyncio.to_thread 
            # if we pass the context manager itself. 
            # Better pattern: Function that does the DB work synchronously, called by to_thread.
            
            def fetch_data_sync(cid):
                with get_db_connection() as conn:
                    data_query = """
                        SELECT a.training_url, a.training_pdf, a.training_article
                        FROM automations a
                        JOIN chatbots c ON a.organization_id = c.organization_id
                        WHERE c.chatbot_id = %s;
                    """
                    return run_query(conn, data_query, (cid,))

            result = await asyncio.to_thread(fetch_data_sync, chatbot_id)

            if not result:
                return ""

            combined_text = ""
            for url_data, file_data, article_data in result:
                 # URL data
                if url_data:
                    for url_item in url_data:
                        # Skip if already trained (handle missing field by defaulting to False)
                        if url_item.get('is_trained', False) == True:
                            logging.info(f"⏭️  Skipping already trained URL: {url_item.get('url')}")
                            continue
                            
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
                        # Skip if already trained (handle missing field by defaulting to False)
                        if file_item.get('is_trained', False) == True:
                            logging.info(f"⏭️  Skipping already trained file: {file_item.get('s3Name')}")
                            continue
                            
                        s3_name = file_item.get('s3Name')
                        if s3_name:
                            file_url = f"{S3_BASE_URL}/{S3_FOLDER_NAME}/{s3_name}"
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
                        # Skip if already trained (handle missing field by defaulting to False)
                        if article.get('is_trained', False) == True:
                            logging.info(f"⏭️  Skipping already trained article: {article.get('id')}")
                            continue
                            
                        content = article.get('content', '')
                        if content:
                            combined_text += f"\n\n--- Source: Article ---\n{content}"

            return combined_text
        except Exception as e:
            logging.error(f"Fetch Prep Data Error: {e}")
            return ""

    @staticmethod
    async def get_stored_knowledge(chatbot_id: str) -> str:
        """
        Retrieves the processed text content straight from the Vector DB (training_chunks).
        """
        try:
            # Sync function for DB op
            def get_knowledge_sync(cid):
                with get_db_connection() as conn:
                    query = "SELECT content FROM training_chunks WHERE chatbot_id = %s ORDER BY chunk_index ASC LIMIT 500;"
                    return run_query(conn, query, (cid,))

            result = await asyncio.to_thread(get_knowledge_sync, chatbot_id)
            
            if result:
                full_text = "\n\n".join([r[0] for r in result])
                return full_text
                
            return ""
        except Exception as e:
            logging.error(f"Error getting stored knowledge: {e}")
            return ""

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> list[str]:
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
        5. Marks items as trained in rtserver.
        """
        logging.info(f"🔄 Step 1/5: Fetching training data for chatbot {chatbot_id}")
        text_data = await StandardRAGController.fetch_and_prepare_data(chatbot_id)
        if not text_data:
            logging.info(f"ℹ️  No untrained data found for chatbot {chatbot_id}. All items are already trained or no data exists.")
            return {"status": "success", "message": "No new data to train. All items are already trained."}
        
        logging.info(f"✅ Fetched {len(text_data)} characters of training data")
        
        # 1. Chunking
        logging.info(f"🔄 Step 2/5: Chunking text data...")
        chunks_text = StandardRAGController.chunk_text(text_data)
        logging.info(f"✅ Generated {len(chunks_text)} chunks for chatbot {chatbot_id}")
        
        # 2. Embedding (Batch)
        # We process in small batches of 20 to avoid rate limits if needed, 
        # but OpenAI handles list inputs well.
        logging.info(f"🔄 Step 3/5: Generating embeddings for {len(chunks_text)} chunks...")
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
        logging.info(f"🔄 Step 4/5: Saving embeddings to database...")
        # Use Thread for DB Ops
        await asyncio.to_thread(delete_chunks, chatbot_id)
        
        if chunks_data:
            await asyncio.to_thread(insert_chunk_batch, chatbot_id, chunks_data)
        
        logging.info(f"✅ Successfully saved {len(chunks_data)} chunks to database for chatbot {chatbot_id}")
        
        # 4. Mark items as trained in rtserver
        logging.info(f"🔄 Step 5/5: Marking items as trained in rtserver...")
        try:
            await StandardRAGController.mark_items_as_trained(chatbot_id)
            logging.info(f"✅ Marked all items as trained for chatbot {chatbot_id}")
        except Exception as e:
            logging.warning(f"⚠️  Failed to mark items as trained: {e}")
            # Don't fail the entire ingestion if marking fails
        
        return True

    @staticmethod
    async def mark_items_as_trained(chatbot_id: str):
        """
        Directly updates the database to mark all untrained items as trained after successful ingestion.
        """
        try:
            # Get organization_id and current training data from chatbot_id
            def get_and_update_training_status(cid):
                with get_db_connection() as conn:
                    # First, fetch current data
                    query = """
                        SELECT c.organization_id, a.training_url, a.training_pdf, a.training_article
                        FROM chatbots c
                        JOIN automations a ON c.organization_id = a.organization_id
                        WHERE c.chatbot_id = %s
                    """
                    with conn.cursor() as cur:
                        cur.execute(query, (cid,))
                        result = cur.fetchone()
                        
                        if not result:
                            return None
                        
                        organization_id, training_url, training_pdf, training_article = result
                        
                        # Mark all untrained items as trained
                        if training_url:
                            for item in training_url:
                                if item.get('is_trained', False) != True:
                                    item['is_trained'] = True
                        
                        if training_pdf:
                            for item in training_pdf:
                                if item.get('is_trained', False) != True:
                                    item['is_trained'] = True
                        
                        if training_article:
                            for item in training_article:
                                if item.get('is_trained', False) != True:
                                    item['is_trained'] = True
                        
                        # Update the database with modified data
                        update_query = """
                            UPDATE automations
                            SET training_url = %s, training_pdf = %s, training_article = %s, updated_at = NOW()
                            WHERE organization_id = %s
                        """
                        
                        import json
                        # Convert to JSON, but use [] for empty/None arrays to avoid null constraint violation
                        cur.execute(update_query, (
                            json.dumps(training_url if training_url else []),
                            json.dumps(training_pdf if training_pdf else []),
                            json.dumps(training_article if training_article else []),
                            organization_id
                        ))
                        conn.commit()
                        
                        return {
                            'organization_id': organization_id,
                            'urls_count': len([i for i in (training_url or []) if i.get('is_trained') == True]),
                            'pdfs_count': len([i for i in (training_pdf or []) if i.get('is_trained') == True]),
                            'articles_count': len([i for i in (training_article or []) if i.get('is_trained') == True])
                        }
            
            result = await asyncio.to_thread(get_and_update_training_status, chatbot_id)
            
            if not result:
                logging.warning(f"No automation data found for chatbot {chatbot_id}")
                return
            
            logging.info(f"✅ Successfully marked {result['urls_count']} URLs, {result['pdfs_count']} PDFs, and {result['articles_count']} articles as trained")
            
        except Exception as e:
            logging.error(f"Error marking items as trained: {e}")
            raise

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
                
                # Add Handoff Tool
                tools.append({
                    "type": "function",
                    "function": {
                        "name": "handoff_to_support",
                        "description": "Moves the customer to the priority support pipeline OR requests an immediate call. Use when user explicitly creates a support request.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "email": {"type": "string", "description": "Customer email"},
                                "name": {"type": "string", "description": "Customer name"},
                                "phone": {"type": "string", "description": "Customer phone"},
                                "urgency": {
                                    "type": "string", 
                                    "enum": ["immediate", "later"],
                                    "description": "If user wants 'immediate' call/help right now, or 'later' (scheduled/pipeline)."
                                }
                            },
                            "required": ["email"]
                        }
                    }
                })
                
                tool_choice = "auto"
                
                # Append to System Instruction
                field_descriptions = []
                for f_id, f_prop in properties.items():
                    field_descriptions.append(f"- {f_prop['description']} (internal_id: {f_id})")
                
                fields_str = "\n".join(field_descriptions)
                
                
                # Updated system instruction - wait 3 messages before asking for details
                if user_email:
                     # 2a. Fetch Customer Details if available
                     customer_context_str = ""
                     try:
                         with get_db_connection() as conn:
                             cust = get_customer_by_email(chatbot_id, user_email, conn)
                             if cust:
                                 c_name = cust.get("name")
                                 c_phone = cust.get("phone")
                                 if c_name: 
                                     customer_context_str += f"Name: {c_name}\n"
                                     customer_context_str += f"IMPORTANT: Address the user by their name ({c_name}) occasionally to be friendly.\n"
                                 if c_phone: customer_context_str += f"Phone: {c_phone}\n"
                     except Exception as e:
                         print(f"Error fetching customer context: {e}")

                     # If we already know the email (returning user or context), just ask for missing info or confirm.
                     system_instruction += (
                        f"\n\n[USER CONTEXT]\n"
                        f"You are speaking with a user whose email is: {user_email}.\n"
                        f"{customer_context_str}"
                        f"Since you already have their email, do NOT ask for it again.\n"
                        f"However, if you do not have their Name or Phone in the context above, please ask for those politely after 3 turns.\n"
                     )
                else:
                     system_instruction += (
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

                system_instruction += (
                    f"\n[SUPPORT HANDOFF (CRITICAL)]\n"
                    f"You must proactively capture the user's details (Name, Email, Phone) and move them to the pipeline if they show HIGH INTEREST.\n"
                    f"Triggers for HIGH INTEREST include:\n"
                    f"1. Asking about PRICING or cost.\n"
                    f"2. Asking for comparisons with COMPITITORS (e.g., Freshworks, Intercom).\n"
                    f"3. Asking deep/detailed questions about COMPANY FEATURES or technical specs.\n"
                    f"4. Explicitly asking to speak to a human or support.\n"
                    f"ACTION IF TRIGGERED:\n"
                    f"1. Check if you have Name, Email, Phone. If missing, ASK for them politely one by one.\n"
                    f"2. Once you have the details, call 'handoff_to_support' with urgency='later' to save them to the pipeline first.\n"
                    f"3. AFTER saving, ASK the user: 'I have added you to our priority queue. would you like to connect with a support agent immediately?'\n"
                    f"4. IF USER SAYS YES: Call 'handoff_to_support' AGAIN with urgency='immediate'.\n"
                    f"5. IF USER SAYS NO: Say 'Great! Our team will reach out to you shortly.'\n"
                )

        # 3. Manage Thread/Conversation
        # Use Context Manager to automatically get/release pool connection
        # 3. Manage Thread/Conversation
        # Use Context Manager to automatically get/release pool connection
        
        history_messages = []
        is_new_thread = False
        
        try:
            with get_db_connection() as conn:
                # 3a. Resolve User Identity if missing
                if conversation_id and not is_new_thread and not user_email:
                    meta = get_conversation_metadata(conversation_id, conn)
                    if meta and meta.get("user_email"):
                        user_email = meta.get("user_email")
                        print(f"✅ Resolved User Email from Conversation: {user_email}")

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

                # 4. Detect Returning User
                is_returning_user = False
                customer_data = None
                
                # We need user_email for detection. Currently it might be in history or passed context?
                # Standard chat usually doesn't pass email in body unless we update the endpoint signature.
                # However, we have user_email in the session or context. 
                # Let's check where 'user_email' comes from. It's passed to generate_realtime_session but here it is chat_stream?
                # Ah, standard chat uses /standard/chat which has body. 
                # Assuming the controller method receives it or we need to look it up from conversation_id if stored?
                # We save email in bot_conversations on creation.
                
                # Let's try to get email from conversation record if available
                if conversation_id:
                     u_email_query = "SELECT user_email FROM bot_conversations WHERE conversation_id = %s"
                     email_res = run_query(conn, u_email_query, (conversation_id,))
                     if email_res and email_res[0][0]:
                           user_email = email_res[0][0]
                           if user_email and "guest" not in user_email and "@" in user_email:
                                customer_data = get_customer_by_email(chatbot_id, user_email, conn)
                                if customer_data: is_returning_user = True

                # Separate Form Instruction to inject it closer to User Prompt for stronger adherence
                form_system_instruction = ""
                
                if is_returning_user:
                     c_name = customer_data.get("name", "")
                     c_phone = customer_data.get("phone", "")
                     
                     form_system_instruction = (
                        f"\n\n[RETURNING CUSTOMER DETECTED]\n"
                        f"You are speaking with a valued returning customer.\n"
                     )
                     
                     if c_name:
                         form_system_instruction += (
                             f"Their name is: {c_name}.\n"
                             f"IMPORTANT: Greet them by name (e.g., 'Hello {c_name}') at the start.\n"
                             f"Address them by name occasionally throughout the conversation.\n"
                         )
                     
                     form_system_instruction += "You have their details, so do NOT ask for Name/Email/Phone."
                     # Clear tools if we want to prevent form tool usage for returning users?
                     # Ideally yes, or keep it just in case they want to update? 
                     # Plan said "No tools needed for returning users" regarding form.
                     # Let's remove submit_pre_chat_form from tools if present
                     tools = [t for t in tools if t['function']['name'] != 'submit_pre_chat_form']

                elif form_config and fields_str:
                     conversation_turn_count = len(history_messages) // 2  # Count user-bot exchanges
                     if conversation_turn_count >= 3:
                          # After 3 turns, start asking for details
                          form_system_instruction = (
                             f"\n\n[SYSTEM INTERVENTION - DETECT & COLLECT USER DETAILS]"
                             f"\nYou have had {conversation_turn_count} conversation turns with the user."
                             f"\nNow is the time to collect: Name, Email, and Phone Number."
                             f"\nLOGIC FLOW:"
                             f"\n1. REVIEW what you have already collected from previous messages."
                             f"\n2. IF you have AT LEAST ONE NEW PIECE of info (e.g. Name), call 'submit_pre_chat_form' IMMEDIATELY."
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
                             f"\nDo NOT ask for name, email, or phone number yet UNLESS the user expresses 'High Interest' or 'Heavy Intent'."
                             f"\n\n[HEAVY INTENT TRIGGERS]"
                             f"\nIf the user says any of the following, you match 'Heavy Intent':"
                             f"\n1. 'I want to speak to support' or similar."
                             f"\n2. Asks about PRICING."
                             f"\n3. Asking for comparisons with COMPETITORS."
                             f"\n4. Asking specifically 'how to buy' or 'sign up'."
                             f"\n\n[ACTION ON HEAVY INTENT]"
                             f"\n- If 'Heavy Intent' is detected, IGNORE the 'wait 3 turns' rule."
                             f"\n- Immediately say: 'I'd be happy to help with that! First, may I know your name?'"
                             f"\n- Collect Name, Email, Phone ONE BY ONE."
                             f"\n- Then call 'submit_pre_chat_form'."
                             f"\n- Then continue the conversation/answer the question."
                          )
                
        except Exception as e:
             logging.error(f"Error in chat setup: {e}")
             yield f"data: {json.dumps({'error': str(e)})}\n\n"
             return

        # 5. Call OpenAI (Chat Completion) - Connection RELEASED here
        full_response = ""
        tool_call_buffer = [] 
        
        try:
            # Construct Messages for LLM
            # 1. System
            full_system_prompt = f"{system_instruction}{form_system_instruction}"
            messages = [{"role": "system", "content": full_system_prompt}]
            
            # 2. History
            messages.extend(history_messages)
            
            # 3. Current User Message
            messages.append({"role": "user", "content": prompt})

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
                    
                    tool_result = {"status": "error", "message": "Unknown tool"}

                    if tc['name'] == 'handoff_to_support':
                        try:
                            # Extract args
                            args = {}
                            if tc.get("arguments"):
                                try:
                                    args = json.loads(tc["arguments"])
                                except:
                                    pass
                            
                            email_arg = args.get("email") or user_email
                            name_arg = args.get("name")
                            phone_arg = args.get("phone")
                            urgency_arg = args.get("urgency")

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
                                      # from DB.postgresDB import create_notification (Removed: Global import used)
                                     
                                     # Also add to pipeline for visibility in board
                                     # with get_db_connection() as conn:
                                     #    move_customer_to_pipeline(chatbot_id, email_arg, conn)

                                     title = f"Urgent Callback: {name_arg or email_arg}"
                                     message = f"User has requested an immediate callback via standard chat. Phone: {phone_arg or 'N/A'}"
                                     # Include user_id for generic 'call' targeting (since Messenger registers with it)
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

                    elif tc['name'] == 'submit_pre_chat_form':
                        # Save to CRM via rtserver logic
                        try:
                            form_data = json.loads(tc['arguments'])
                            rtserver_url = os.getenv("RT_SERVER_URL", "http://localhost:3000")
                            
                            # Get chatbot organization_id
                            conn = postgres_connection()
                            org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
                            org_result = run_query(conn, org_query, (chatbot_id,))
                            conn.close()
                            
                            if org_result and org_result[0]:
                                # Construct Save Data
                                custom_data = {
                                    "name": form_data.get("name", ""),
                                    "phone": form_data.get("phone", ""),
                                    "source": "chatbot",
                                    "chatbot_id": chatbot_id
                                }
                                email_to_save = form_data.get("email", "")
                                
                                # Use new DB helper (handles connection internally)
                                success = save_customer(chatbot_id, email_to_save, custom_data)
                                
                                if success:
                                    # Also update conversation if ID exists
                                    if conversation_id and email_to_save:
                                         update_conversation_email(conversation_id, email_to_save)
                                         
                                    tool_result = {"status": "success", "message": "Data processed. Continue conversation."}
                                else:
                                    tool_result = {"status": "error", "message": "Failed to save data."}
                            else:
                                print(f"⚠️ Organization not found for chatbot {chatbot_id}")
                                tool_result = {"status": "success", "message": "Ack."}

                        except Exception as error:
                            print(f"❌ Error submitting form: {error}")
                            tool_result = {"status": "error", "message": "Form submission failed."}

                    
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
