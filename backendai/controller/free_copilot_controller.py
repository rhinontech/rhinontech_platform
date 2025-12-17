import asyncio
import json
import uuid
import logging
import os
import requests
from datetime import datetime
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

import google.generativeai as genai
from openai import OpenAI

from DB.postgresDB import postgres_connection, run_query


# Initialize router
router = APIRouter()

# ----------------- GLOBAL CONFIG -----------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing in environment variables")

client = OpenAI(api_key=OPENAI_API_KEY)


# ----------------- TOKEN HELPER -----------------
def estimate_tokens(text: str) -> int:
    """Very basic token estimation (replace with a tokenizer if needed)."""
    return len(text.split())


# ----------------- OPENAI ASSISTANT HELPERS -----------------
async def get_assistant(chatbot_id):
    conn = postgres_connection()
    query = "SELECT assistant_id FROM bot_assistants WHERE chatbot_id = %s;"
    result = run_query(conn, query, (chatbot_id,))
    conn.close()
    if result:
        return result[0][0]
    return None



async def get_instruction_using_assistant_id(assistant_id: str) -> str:
    """Fetch assistant instructions from OpenAI using assistant_id."""
    assistant = client.beta.assistants.retrieve(assistant_id)
    return assistant.instructions


async def generate_openai_instruction_context(chatbot_id: str) -> str:
    """Combine voice/behavior guidelines with assistant’s base instructions."""
    assistant_id = await get_assistant(chatbot_id)
    base_instructions = await get_instruction_using_assistant_id(assistant_id)

    custom_prefix = """
    You are an AI assistant for this company.
    Always respond clearly, helpfully, and concisely.
    Use a friendly but professional tone.
    Keep responses short and conversational.
    """

    return f"{custom_prefix.strip()}\n\n{base_instructions.strip()}"


# ----------------- FREE PLAN COPILOT CONTROLLER -----------------
class FreePlanCopilotController:
    """
    Handles Gemini sessions for free-plan users.
    Fetches chatbot-specific API key and OpenAI instruction context,
    caching both in memory for speed and efficiency.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.model_name = model_name
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.api_key_cache: Dict[str, str] = {}  # chatbot_id -> api_key
        self.instruction_cache: Dict[str, str] = {}  # chatbot_id -> combined instructions

    async def _fetch_api_key(self, chatbot_id: str) -> str:
        """Fetch Gemini API key for this chatbot (cached)."""
        if chatbot_id in self.api_key_cache:
            return self.api_key_cache[chatbot_id]

        connection = await asyncio.to_thread(postgres_connection)
        if not connection:
            raise HTTPException(status_code=500, detail="Database connection failed")

        query = "SELECT api_key FROM chatbots WHERE chatbot_id = %s;"
        result = await asyncio.to_thread(run_query, connection, query, (chatbot_id,))

        api_key = None
        if isinstance(result, list) and len(result) > 0:
            row = result[0]
            api_key = row.get("api_key") if isinstance(row, dict) else row[0]

        if not api_key:
            raise HTTPException(status_code=404, detail="Gemini API key not found for chatbot")

        self.api_key_cache[chatbot_id] = api_key
        return api_key

    async def _get_instruction_context(self, chatbot_id: str) -> str:
        """Fetch or cache OpenAI-based training/instructions."""
        if chatbot_id in self.instruction_cache:
            return self.instruction_cache[chatbot_id]

        instruction_context = await generate_openai_instruction_context(chatbot_id)
        self.instruction_cache[chatbot_id] = instruction_context
        return instruction_context

    async def create_session(self, session_id: str, chatbot_id: str) -> str:
        """Start a new Gemini chat session."""
        api_key = await self._fetch_api_key(chatbot_id)
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(self.model_name)
            chat_session = model.start_chat(history=[])

            self.sessions[session_id] = {
                "chat": chat_session,
                "created_at": datetime.utcnow(),
                "history": [],
                "api_key": api_key,
                "chatbot_id": chatbot_id,
            }
            return session_id
        except Exception as e:
            logging.error(f"Error creating Gemini session: {e}")
            raise ValueError(f"Invalid or expired Gemini API key: {str(e)}")

    async def get_or_create_session(self, session_id: str, chatbot_id: str):
        """Reuse existing Gemini chat session if available."""
        if session_id not in self.sessions:
            await self.create_session(session_id, chatbot_id)
        else:
            genai.configure(api_key=self.sessions[session_id]["api_key"])
        return self.sessions[session_id]

    async def generate_streaming_response(
        self,
        session_id: str,
        chatbot_id: str,
        prompt: str,
        context_data: Dict[str, Any] = None,
    ):
        """Generate streaming Gemini response using cached context + OpenAI instructions."""
        session = await self.get_or_create_session(session_id, chatbot_id)
        chat_session = session["chat"]

        # Combine OpenAI instructions + Gemini prompt
        try:
            instruction_context = await self._get_instruction_context(chatbot_id)
        except Exception as e:
            logging.warning(f"Failed to fetch OpenAI instruction context: {e}")
            instruction_context = ""

        full_prompt = f"{instruction_context}\n\n{self._prepare_prompt_with_context(prompt, context_data)}"

        full_response = ""

        def sync_stream():
            """Blocking Gemini API stream converted into generator."""
            try:
                response = chat_session.send_message(full_prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as e:
                logging.error(f"Gemini streaming error: {e}")
                yield f"[ERROR]: {str(e)}"

        # Convert sync generator to async stream
        async for token in self._async_yield_from_thread(sync_stream):
            if token.startswith("[ERROR]:"):
                yield f"data: {json.dumps({'error': token, 'done': True})}\n\n"
                return

            full_response += token
            yield f"data: {json.dumps({'token': token, 'event': 'stream'})}\n\n"
            await asyncio.sleep(0)

        # Optional: store local session memory
        session["history"].append({"role": "user", "message": prompt, "timestamp": datetime.utcnow()})
        session["history"].append({"role": "assistant", "message": full_response, "timestamp": datetime.utcnow()})

        yield f"data: {json.dumps({'event': 'end'})}\n\n"
        yield f"data: {json.dumps({'event': 'complete', 'conversation_id': session_id})}\n\n"

    async def _async_yield_from_thread(self, generator_func):
        """Helper: converts blocking Gemini generator into async iterator."""
        loop = asyncio.get_event_loop()

        def to_list():
            return list(generator_func())

        for item in await loop.run_in_executor(None, to_list):
            yield item

    def _prepare_prompt_with_context(self, prompt: str, context_data: Dict[str, Any] = None) -> str:
        """Optionally add structured data (tickets, history, etc.) to the prompt."""
        if not context_data:
            return prompt

        context_str = ""
        if "ticket_info" in context_data:
            t = context_data["ticket_info"]
            context_str += f"Ticket Info: {t.get('id', 'N/A')} - {t.get('subject', 'N/A')}\n"
        if "past_chats" in context_data:
            context_str += "Previous messages:\n"
            for c in context_data["past_chats"][-3:]:
                context_str += f"{c['role']}: {c['message']}\n"

        return f"{context_str}\nUser: {prompt}"

    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Return session chat history."""
        return self.sessions.get(session_id, {}).get("history", [])


# Initialize global instance
free_copilot = FreePlanCopilotController()
