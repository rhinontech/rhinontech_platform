import logging
import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import HTTPException
from services.openai_services import client
from services.embedding_service import embedding_service
from DB.postgresDB import postgres_connection, run_query, run_write_query, search_vectors
from controller.chatbot_config import get_url_data, pdf_data, doc_data, txt_data, ppt_data, image_data

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
                        content = get_url_data(url_item['url'])
                        combined_text += f"\n\n--- Source: {url_item['url']} ---\n{content}"
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
        
        text_data = await StandardRAGController.fetch_and_prepare_data(chatbot_id)
        if not text_data:
            raise Exception("No training data found for this chatbot.")
        
        # 1. Chunking
        chunks_text = StandardRAGController.chunk_text(text_data)
        logging.info(f"Generated {len(chunks_text)} chunks for chatbot {chatbot_id}")
        
        # 2. Embedding (Batch)
        # We process in small batches of 20 to avoid rate limits if needed, 
        # but OpenAI handles list inputs well.
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
            vector = embedding_service.embed_text(chunk) 
            if vector:
                chunks_data.append({
                    "index": i,
                    "content": chunk,
                    "embedding": vector
                })
        
        # 3. Replace Data
        # Use Thread for DB Ops
        await asyncio.to_thread(delete_chunks, chatbot_id)
        
        if chunks_data:
            await asyncio.to_thread(insert_chunk_batch, chatbot_id, chunks_data)
        
        return True

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
        system_instruction = (
            "You are a helpful assistant for this organization.\n"
            "Use the following pieces of retrieved context to answer the user's question.\n"
            "If the answer is not in the context, say you don't know, but answer politely.\n"
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
                
                system_instruction += (
                    f"\n\n[MANDATORY FORM COLLECTION]\n"
                    f"Before providing ANY assistance or answering ANY questions, you MUST collect the following user details: {fields_str}\n"
                    f"If the user provides only SOME of these details, you must acknowledge them and IMMEDIATELY ask for the remaining missing details.\n"
                    f"However, collect ONLY the details listed above. Do NOT ask for 'Name' or 'Phone' unless they are explicitly listed in the requirements.\n"
                    f"Do NOT generate a tool call until you have received ALL the required values.\n"
                    f"Once you have ALL the values, call the 'submit_pre_chat_form' function immediately."
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
                if form_config and fields_str:
                     form_system_instruction = (
                        f"\n\n[SYSTEM INTERVENTION - MANDATORY FORM]"
                        f"\nREQUIRED DETAILS: {fields_str}"
                        f"\nLOGIC FLOW:"
                        f"\n1. ANALYZE the user's message below."
                        f"\n2. IF the user has provided the required details, you MUST call 'submit_pre_chat_form' IMMEDIATELY."
                        f"\n3. IF the details are missing, you MUST ask for them explicitly."
                        f"\n4. CONSTRAINT: Do NOT ask for unlisted fields (like Name/Phone) if they are not in the REQUIRED DETAILS list."
                        f"\n5. Do NOT answer the user's question until the form is submitted."
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
                    
                    # 2. Add Tool Output Message to History
                    # Simulate successful submission
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps({"status": "success", "message": "Form details received."})
                    })
                
                # 3. Inform User (Optional, but good UX)
                thank_you_msg = "Thank you for sharing your details! "
                yield f"data: {json.dumps({'token': thank_you_msg})}\n\n"
                full_response += thank_you_msg
                
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
