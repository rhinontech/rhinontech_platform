import os
import requests
from fastapi import HTTPException
from openai import OpenAI

from DB.postgresDB import postgres_connection, run_query

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)


async def get_assistant(chatbot_id):
    conn = postgres_connection()
    query = "SELECT assistant_id FROM bot_assistants WHERE chatbot_id = %s;"
    result = run_query(conn, query, (chatbot_id,))
    conn.close()
    if result:
        return result[0][0]
    return None



async def get_instruction_using_assistant_id(assistant_id: str) -> str:
    assistant = client.beta.assistants.retrieve(assistant_id)
    return assistant.instructions


async def generate_openai_ephemeral_session(chatbot_id) -> dict:
    assistant_id=   await get_assistant(chatbot_id)
    print(assistant_id)
    base_instructions = await get_instruction_using_assistant_id(assistant_id)

    # Add your voice assistant context
    custom_prefix = """
    You are a  AI voice-assistant for this company, the company name and other instruction or given below.
    - Always respond in a clear, friendly tone.
    - Keep replies short and natural for speaking aloud.
    - If the user pauses for too long, ask if they’re still there.
    - Use a professional, supportive tone.
    """

    # Combine both
    instructions = f"{custom_prefix.strip()}\n\n{base_instructions.strip()}"

    # return instructions
    # print("instructions", instructions)

    url = "https://api.openai.com/v1/realtime/sessions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-realtime-preview-2024-10-01",
        "voice": "verse",
        "instructions": instructions,
    }


    try:
        response = requests.post(url, headers=headers, json=payload)
        if not response.ok:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to generate ephemeral key: {response.text}",
            )
        return response.json()
    except Exception as e:
        print("Error generating ephemeral key:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")
