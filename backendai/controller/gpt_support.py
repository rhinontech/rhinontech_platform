import asyncio
from datetime import datetime, timezone

import json
import time
import logging
from dotenv import load_dotenv
# from openai import OpenAI
import redis
from services.openai_services import client
from DB.postgresDB import postgres_connection, run_query, run_write_query, get_db_connection



r = redis.StrictRedis(host='localhost', port=6379, db=0)

# Load environment variables from .env file
load_dotenv()

get_response_format = {
    "title": "generate a short and relevant conversation title.",
    "response": "Your response to the user will be here (keep it concise unless more detail is requested).",
    "setQuickOptions": "True/False (If the user ask to redirect option and or to buy something set it to True, else keep False)",
}
# content = f"You are a {name} AI CHAT BOT, You should know this {pdfData} with this data {UrlData}."

org_assistant_map = {}

def extract_instruction_from_data(org_data):
    """
    Extract instruction dynamically from MongoDB data.
    Handles nested 'chatbot_data' structure and includes tone and style.
    """

    # Extract chatbot data
    chatbot_data = org_data.get('chatbot_data', {})
    url_data = chatbot_data.get('url_data', "")
    article_data = chatbot_data.get('article_data', {})
    file_data = chatbot_data.get('file_data', "")

    # Define tone and style
    tone = "Friendly, conversational, and natural. Avoid robotic or overly formal language."
    style = "Keep responses short and to the point. Prioritize clarity and brevity while maintaining a natural conversational flow."

    # Construct instruction string
    instruction = f"**Tone:** {tone}\n\n"
    instruction += f"**Style:** {style}\n\n"
    instruction += f"**Synced Website Info:** {url_data}\n\n"
    instruction += "Added instruction from the data are below:\n\n"
    instruction += f"**File Info:**\n{file_data}\n\n"
    instruction += "**Article Data:**\n"
    instruction += f"  - Title: {article_data.get('title', '')}\n"
    instruction += f"  - Description: {article_data.get('description', '')}\n"
    instruction += f"  - Content: {article_data.get('content', '')}\n"

    return instruction


def get_assistant(chatbot_id):
    with get_db_connection() as conn:
        query = "SELECT assistant_id FROM bot_assistants WHERE chatbot_id = %s;"
        result = run_query(conn, query, (chatbot_id,))
    
    if result:
        return result[0][0]
    return None

    # else:
    #     org_data = chatbot_config_collection.find_one({'chatbot_id': chatbot_id})
    #     if not org_data:
    #         return jsonify({'error': 'No data found for the provided chatbot_id'}), 404

    #     instruction = extract_instruction_from_data(org_data)

    #     assistant = client.beta.assistants.create(
    #         name=f"Support Assistant",
    #         instructions=instruction,
    #         tools=[{"type": "code_interpreter"}],
    #         model="gpt-3.5-turbo"
    #     )
        
    #     assistant_id = assistant.id
    #     # org_assistant_map[chatbot_id] = assistant_id

    #     assistant_collection.update_one(
    #         {'chatbot_id': chatbot_id},
    #         {
    #             '$set': {
    #                 'assistant_id': assistant_id,
    #                 'updated_at': datetime.now()
    #             },
    #             '$setOnInsert': {
    #                 'created_at': datetime.now()
    #             }
    #         },
    #         upsert=True
    #     )

    #     return assistant_id


def start_new_chat(user_id, chatbot_id, user_email,user_plan="Free"):
    with get_db_connection() as conn:
        current_time = datetime.now(timezone.utc)
        thread = client.beta.threads.create()
        thread_id = thread.id

        query = """
            INSERT INTO bot_conversations (user_id, user_email, chatbot_id, user_plan, conversation_id, title, history, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
        """
        params = (user_id, user_email, chatbot_id, user_plan, thread_id, "Untitled Conversation", '[]', current_time, current_time)
        run_write_query(conn, query, params)
    return thread_id


def wait_for_run_completion(thread_id, run_id, sleep_interval=1):
    while True:
        try:
            run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
            if run.completed_at:
                elapsed_time = run.completed_at - run.created_at
                formatted_elapsed_time = time.strftime(
                    "%H:%M:%S", time.gmtime(elapsed_time)
                )
                print(f"Run completed in {formatted_elapsed_time}")
                logging.info(f"Run completed in {formatted_elapsed_time}")
                # Get messages here once Run is completed!
                messages = client.beta.threads.messages.list(thread_id=thread_id)
                last_message = messages.data[0]
                response = last_message.content[0].text.value
                print(f"Assistant Response: {response}")
                break
        except Exception as e:
            logging.error(f"An error occurred while retrieving the run: {e}")
            break
        logging.info("Waiting for run to complete...")
        time.sleep(sleep_interval)

async def chat_support(
    user_input: str,
    user_id: str,
    chatbot_id: str,
    conversation_id: str,
    limit_exceed: bool,
    user_email: str,
    user_plan:str,
    final_response_holder: dict = None,
):
    try:
        # Check if conversation exists; if not, create a new one
        conversation_created = False
        with get_db_connection() as conn:
            if not conversation_id or conversation_id == "NEW_CHAT":
                conversation_created = True
            else:
                check_query = "SELECT 1 FROM bot_conversations WHERE conversation_id = %s;"
                exists = run_query(conn, check_query, (conversation_id,))
                if not exists:
                     conversation_created = True
        
        if conversation_created:
             conversation_id = start_new_chat(user_id, chatbot_id, user_email,user_plan)

        assistant_id = get_assistant(chatbot_id)
        if not assistant_id:
            yield f"data: {json.dumps({'error': 'Assistant not found'})}\n\n"
            return

        # Check if plan limit exceeded
        if limit_exceed:
            msg = (
                "Our AI assistant is temporarily unavailable. "
                "You can contact support or raise a ticket — our team will get back to you soon."
            )
            yield f"data: {json.dumps({'event': 'limit_exceeded', 'token': msg})}\n\n"
            yield f"data: {json.dumps({'event': 'end'})}\n\n"
            return

        # Send the message to OpenAI Thread
        client.beta.threads.messages.create(
            thread_id=conversation_id,
            role="user",
            content=f"{user_input}\n\nRespond clearly and concisely.",
        )

        assistant_response = ""

        # OpenAI stream (real-time token stream)
        def openai_stream():
            with client.beta.threads.runs.stream(
                thread_id=conversation_id,
                assistant_id=assistant_id,
            ) as stream:
                for event in stream:
                    yield event

        # Process the streaming events
        for event in openai_stream():
            event_class = event.__class__.__name__
            if event_class == "ThreadMessageDelta":
                delta_data = getattr(event, "data", None)
                if delta_data and hasattr(delta_data, "delta") and hasattr(delta_data.delta, "content"):
                    for content_piece in delta_data.delta.content:
                        if getattr(content_piece, "type", None) == "text":
                            token_piece = getattr(content_piece.text, "value", "")
                            assistant_response += token_piece
                            yield f"data: {json.dumps({'token': token_piece})}\n\n"
                            await asyncio.sleep(0)
            elif event_class == "ThreadMessageCompleted":
                break
            elif event_class == "Error":
                yield f"data: {json.dumps({'error': str(event)})}\n\n"
                return

        if final_response_holder is not None:
            final_response_holder["response_text"] = assistant_response

        yield f"data: {json.dumps({'event': 'end'})}\n\n"

        # Save chat messages in PostgreSQL
        current_time = datetime.now(timezone.utc)

        # Append history messages (JSONB)
        messages = [
            {"role": "user", "text": user_input, "timestamp": current_time.isoformat()},
            {"role": "bot", "text": assistant_response, "timestamp": current_time.isoformat()},
        ]

        with get_db_connection() as conn:
            update_query = """
                UPDATE bot_conversations
                SET history = COALESCE(history, '[]'::jsonb) || %s::jsonb,
                    updated_at = %s
                WHERE conversation_id = %s;
            """
            run_write_query(conn, update_query, (json.dumps(messages), current_time, conversation_id))

            # Check if title is still "Untitled Conversation"
            title_query = "SELECT title FROM bot_conversations WHERE conversation_id = %s;"
            result = run_query(conn, title_query, (conversation_id,))
             
            if result and result[0][0] == "Untitled Conversation":
                # We can do title generation outside the lock, or keep it short. 
                # Better to release lock, generate title, then update. 
                pass # Logic continues below
        
        # NOTE: Original code had conn.close() after query but before title gen logic used 'result'.
        # I will preserve the logic flow but use safer DB access.
        
        if result and result[0][0] == "Untitled Conversation":
            try:
                title_prompt = (
                    f"Generate a short, descriptive chat title (max 5 words) based on this exchange.\n"
                    f"User: {user_input}\nAssistant: {assistant_response}"
                )

                title_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You create concise, descriptive chat titles."},
                        {"role": "user", "content": title_prompt},
                    ],
                    max_tokens=20,
                    temperature=0.7,
                )

                ai_generated_title = title_response.choices[0].message.content.strip().replace('"', '')

                with get_db_connection() as conn_title:
                    update_title_query = "UPDATE bot_conversations SET title = %s WHERE conversation_id = %s;"
                    run_write_query(conn_title, update_title_query, (ai_generated_title, conversation_id))
            except Exception as e:
                logging.error(f"Title generation failed: {e}")

        yield f"data: {json.dumps({'event': 'complete', 'conversation_id': conversation_id})}\n\n"

    except Exception as e:
        logging.error("Unexpected error in chat_support", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


def get_chat_history(user_id, chatbot_id, conversation_id):
    with get_db_connection() as conn:
        query = """
            SELECT history, post_chat_review
            FROM bot_conversations
            WHERE user_id = %s AND chatbot_id = %s AND conversation_id = %s;
        """
        result = run_query(conn, query, (user_id, chatbot_id, conversation_id))

    if result:
        # result[0] = (history_json, post_chat_review_json)
        return {
            "history": result[0][0],
            "post_chat_review": result[0][1]
        }

    raise ValueError("Conversation not found")



def get_conversation_by_user_id(user_id, chatbot_id):
    with get_db_connection() as conn:
        # 1. Fetch AI Bot Conversations
        bot_query = """
            SELECT conversation_id, title, history, updated_at
            FROM bot_conversations
            WHERE user_id = %s AND chatbot_id = %s
        """
        bot_results = run_query(conn, bot_query, (user_id, chatbot_id))

        # 2. Fetch Support Conversations (with Agent Details)
        # We assume users_profiles table exists and is linked via assigned_user_id
        support_query = """
            SELECT 
                sc.id, 
                sc.messages, 
                sc.updated_at,
                up.first_name, 
                up.last_name, 
                up.image_url,
                sc.chatbot_history
            FROM support_conversations sc
            LEFT JOIN users_profiles up ON sc.assigned_user_id = up.user_id
            WHERE sc.user_id = %s AND sc.chatbot_id = %s
        """
        support_results = run_query(conn, support_query, (user_id, chatbot_id))

    # Create a set of conversation IDs that are already in support (chatbot_history)
    support_conversation_ids = set()
    for row in support_results:
        # chatbot_history contains the original bot conversation_id
        chatbot_history = row[6]
        if chatbot_history:
            support_conversation_ids.add(chatbot_history)

    conversation_list = []

    # Process AI Bot Conversations
    for row in bot_results:
        conversation_id, title, history, updated_at = row
        
        # Skip if this conversation exists in support
        if conversation_id in support_conversation_ids:
            continue

        last_chat_time = updated_at
        last_message = ""
        
        if history and isinstance(history, list) and len(history) > 0:
            last_msg_obj = history[-1]
            last_chat_time = last_msg_obj.get('timestamp', updated_at)
            last_message = last_msg_obj.get('text', '')

        conversation_list.append({
            'conversation_id': conversation_id,
            'title': title,
            'last_chat_time': last_chat_time,
            'lastMessage': last_message,
            'type': 'bot'
        })

    # Process Support Conversations
    for row in support_results:
        # sc.id is integer, but frontend expects string ID mostly. 
        # Actually conversation_id in bot_conversations is UUID string. 
        # Support ID is int. We'll convert to string to be safe.
        conv_id_int, messages, updated_at, first_name, last_name, image_url, chatbot_history = row
        
        # Determine Title / Name
        # If agent is assigned, use their name. Else "Support Chat"
        if first_name and last_name:
            displayed_title = f"{first_name} {last_name}".strip()
        else:
            displayed_title = "Support Chat"
            
        # Determine Image
        # If agent is assigned, use their image. Else None (frontend handles default)
        displayed_image = image_url if image_url else None

        last_chat_time = updated_at
        last_message = ""

        # Messages in support_conversations is also JSONB list
        if messages and isinstance(messages, list) and len(messages) > 0:
            last_msg_obj = messages[-1]
            last_chat_time = last_msg_obj.get('timestamp', updated_at)
            last_message = last_msg_obj.get('text', '')

        conversation_list.append({
            'conversation_id': chatbot_history if chatbot_history else str(conv_id_int), # use bot conversation_id if available
            'title': displayed_title,
            'last_chat_time': last_chat_time,
            'lastMessage': last_message,
            'avatar': displayed_image, # Frontend uses this or 'image'
            'name': displayed_title,   # Explicit name field
            'type': 'support'
        })

    # Sort by last_chat_time descending
    # Handle both string (ISO) and datetime objects if necessary, 
    # but run_query usually returns datetime objects for TIMESTAMP columns.
    # JSON timestamps are strings. Let's normalize to string for sorting or ensure types.
    # Python sort works if types are consistent. 
    # Let's trust they are comparable (ISO strings or datetimes).
    # Ideally convert all to ISO string for API response consistency.
    
    def get_sort_key(item):
        t = item['last_chat_time']
        if isinstance(t, str):
            return t
        if isinstance(t, datetime):
            return t.isoformat()
        return ""

    conversation_list.sort(key=get_sort_key, reverse=True)

    return conversation_list
