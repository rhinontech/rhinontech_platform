import asyncio
from datetime import datetime, timezone
import json
import logging
import os
import time

from fastapi import APIRouter, FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from DB.postgresDB import postgres_connection, run_query, run_write_query
from controller.chatbot_config import pdf_data, doc_data, txt_data, ppt_data, image_data,get_url_data
from services.openai_services import client
 

load_dotenv()

S3_BASE_URL = os.getenv("S3_BASE_URL")
RESPONSE_TEMPLATE = {
    "response": "Your response to the user will be here (keep it concise unless more detail is requested)."
}

router = APIRouter()
org_assistant_map = {}
org_thread_map = {}

# Load existing assistants from database on startup
def load_existing_assistants():
    try:
        conn = postgres_connection()
        if conn:
            result = run_query(conn, "SELECT chatbot_id, assistant_id FROM bot_assistants", ())
            if result:
                for row in result:
                    chatbot_id, assistant_id = row
                    org_assistant_map[chatbot_id] = assistant_id
                logging.info(f"Loaded {len(result)} assistants from database")
            conn.close()
    except Exception as e:
        logging.error(f"Error loading assistants: {e}")

# Load assistants on module import
load_existing_assistants()

class AssistantRequest(BaseModel):
    chatbot_id: str

class GenerateRequest(BaseModel):
    chatbot_id: str
    prompt: str

async def extract_instruction_from_data(result):
    instruction = (
        "While talking to the bot it feels more robotic, wanted more natural and human.\n"
        "The responses are a bit longer — can they be made short and to the point?\n"
        "Overall, the bot seems to be repeating the same information instead of completing the conversation and taking bookings.\n"
        "The required information is given below:\n"
    )

    for url_data, file_data, article_data in result:
        # URL data
        for url_item in url_data:
            try:
                url_content = get_url_data(url_item['url'])
                print("URL content:", url_content)
                instruction += f"{url_content}\n"
            except Exception as e:
                instruction += f"Error fetching URL data: {str(e)}\n"

        # File data
        for file_item in file_data:
            file_url = f"{S3_BASE_URL}/{file_item['s3Name']}"
            _, file_extension = os.path.splitext(file_url.lower())

            try:
                if file_extension == '.pdf':
                    response = pdf_data(file_url)
                elif file_extension in ['.doc', '.docx']:
                    response = doc_data(file_url)
                elif file_extension == '.txt':
                    response = txt_data(file_url)
                elif file_extension in ['.ppt', '.pptx']:
                    response = ppt_data(file_url)
                elif file_extension in ['.png', '.jpg', '.jpeg']:
                    response = image_data(file_url)
                else:
                    response = f"Unsupported file type: {file_extension}"
            except Exception as e:
                response = f"Error processing file {file_url}: {str(e)}"

            instruction += f"{response}\n"

        # Article data
        for article in article_data:
            try:
                instruction += f"Article: {article['content']}\n"
            except Exception as e:
                instruction += f"Error reading article: {str(e)}\n"

    return instruction


def get_or_create_thread(chatbot_id: str) -> str:
    if chatbot_id in org_thread_map:
        return org_thread_map[chatbot_id]
    thread = client.beta.threads.create()
    org_thread_map[chatbot_id] = thread.id
    return thread.id

def wait_for_run_completion(thread_id, run_id, sleep_interval=1, timeout=30):
    start_time = time.time()
    while True:
        try:
            run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
            if run.completed_at:
                elapsed_time = run.completed_at - run.created_at
                formatted_elapsed_time = time.strftime("%H:%M:%S", time.gmtime(elapsed_time))
                logging.info(f"Run completed in {formatted_elapsed_time}")
                return
        except Exception as e:
            logging.error(f"Error retrieving run: {e}")
            return
        if time.time() - start_time > timeout:
            raise TimeoutError("Run did not complete within the expected time.")
        time.sleep(sleep_interval)

@router.post("/set_assistant")
async def set_assistant(payload: AssistantRequest):
    try:
        chatbot_id = payload.chatbot_id

        # Connect to Postgres
        connection = await asyncio.to_thread(postgres_connection)
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")

        # Fetch chatbot’s training data
        query = """
        SELECT a.training_url, a.training_pdf, a.training_article
        FROM automations a
        JOIN chatbots c ON a.organization_id = c.organization_id
        WHERE c.chatbot_id = %s;
        """
        result = await asyncio.to_thread(run_query, connection, query, (chatbot_id,))
        if not result:
            raise HTTPException(status_code=404, detail="No chatbot data found")

        # Build the assistant instruction dynamically
        instruction = await extract_instruction_from_data(result)

        # Create a new OpenAI Assistant
        assistant = client.beta.assistants.create(
            name="Cognidolph Bot",
            instructions=instruction,
            tools=[{"type": "code_interpreter"}],
            model="gpt-3.5-turbo"
        )

        assistant_id = assistant.id
        org_assistant_map[chatbot_id] = assistant_id

        #  UPSERT assistant in Postgres bot_assistants table
        upsert_query = """
        INSERT INTO bot_assistants (chatbot_id, assistant_id, chat_count, token_count, created_at, updated_at)
        VALUES (%s, %s, 0, 0, NOW(), NOW())
        ON CONFLICT (chatbot_id)
        DO UPDATE
        SET assistant_id = EXCLUDED.assistant_id,
            updated_at = NOW();
        """


        conn = postgres_connection()
        success = run_write_query( conn, upsert_query, (chatbot_id, assistant_id))

        if not success:
            raise HTTPException(status_code=500, detail="Failed to write assistant to database")

        connection.close()

        return {
            "message": "Assistant created/updated successfully",
            "assistant_id": assistant_id,
        }

    except Exception as e:
        logging.error(f"Error in set_assistant: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to set assistant: {str(e)}")

@router.post("/generate_response")
async def generate_response(payload: GenerateRequest):
    try:
        chatbot_id = payload.chatbot_id
        prompt = payload.prompt

        assistant_id = org_assistant_map.get(chatbot_id)
        if not assistant_id:
            raise HTTPException(status_code=404, detail="No assistant found for chatbot_id")

        thread_id = get_or_create_thread(chatbot_id)

        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=f"{prompt}\n\n{json.dumps(RESPONSE_TEMPLATE, indent=4)}"
        )

        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
        )

        wait_for_run_completion(thread_id, run.id)

        messages = client.beta.threads.messages.list(thread_id=thread_id)
        if not messages.data:
            raise HTTPException(status_code=500, detail="No response from assistant")

        assistant_response = next(
            (msg.content[0].text.value for msg in messages.data if msg.role == "assistant"),
            "No response available"
        )

        return {"response": assistant_response}

    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logging.error(f"Error in generate_response: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error during response generation")

# Add to app
app = FastAPI()
app.include_router(router)
