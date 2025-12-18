
from fastapi import APIRouter, HTTPException,FastAPI
from pydantic import BaseModel
from typing import Any, Dict, Optional
from DB.postgresDB import postgres_connection, run_query, run_write_query
from controller.gpt_support import (
    chat_support, get_assistant, start_new_chat,
    get_chat_history, get_conversation_by_user_id
)
from services.voice_service import generate_openai_ephemeral_session
from fastapi.responses import StreamingResponse

import asyncio, uuid, json, logging
from controller.free_copilot_controller import FreePlanCopilotController
# assuming your original imports are already here

router = APIRouter()
free_copilot = FreePlanCopilotController() 



router = APIRouter()

# Request model
class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    chatbot_id: Optional[str] = None
    user_plan: Optional[str] = None
    conversation_id: Optional[str] = None
    prompt: Optional[str] = None
    currentPlan: Optional[str] = None
    isFreePlan: Optional[bool] = None

class OrgIdRequest(BaseModel):
    chatbot_id: str


# Endpoint: /set_user_assistant
@router.post("/set_user_assistant")
async def set_assistant(request: ChatRequest):
    chatbot_id = request.chatbot_id

    if not chatbot_id:
        raise HTTPException(status_code=400, detail="chatbot_id is required")

    try:
        assistant = get_assistant(chatbot_id)
        logging.info(f"Assistant created and saved for chatbot_id: {chatbot_id}")
        return {"message": "Assistant created successfully", "assistant_id": assistant}
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Failed to set assistant. Please try again.")

# Endpoint: /start_chat
@router.post("/start_chat")
async def start_chat(request: ChatRequest):
    user_id = request.user_id
    chatbot_id = request.chatbot_id
    user_plan = request.user_plan

    if user_id and user_plan:
        thread_id = start_new_chat(user_id, chatbot_id, user_plan)
        return {"thread_id": thread_id}
    else:
        raise HTTPException(status_code=400, detail="User ID and/or User Plan not provided")

def estimate_tokens(text: str) -> int:
    # Rough approximation: 1 token ≈ 0.75 words
    return round(len(text.split()) / 0.75)

@router.post("/chat")
async def chat_assistant(request: ChatRequest):
    if not (request.prompt and request.user_id):
        raise HTTPException(status_code=400, detail="Prompt and User ID must be provided")

    user_id = request.user_id
    user_email = request.user_email
    conversation_id = request.conversation_id
    chatbot_id = request.chatbot_id
    prompt = request.prompt
    isFreePlan = request.isFreePlan
    currentPlan = request.currentPlan
    session_id = str(uuid.uuid4())

    final_response_holder: Dict[str, Any] = {"response_text": ""}
    response_ready = asyncio.Event()

    try:
        # FREE PLAN CHATBOT HANDLING
        if isFreePlan:
            async def generate():
                try:
                    async for chunk in free_copilot.generate_streaming_response(
                        session_id=session_id,
                        chatbot_id=chatbot_id,
                        prompt=prompt
                    ):
                        data_str = chunk.replace("data: ", "").strip()
                        try:
                            data = json.loads(data_str)
                            token = data.get("token")
                            if token:
                                final_response_holder["response_text"] += token
                        except:
                            pass

                        if '"event": "end"' in chunk:
                            response_ready.set()

                        yield chunk
                        await asyncio.sleep(0)
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
                    response_ready.set()

            response = StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "X-Accel-Buffering": "no",
                },
            )


        # PAID PLAN CHATBOT HANDLING
        else:
            from DB.postgresDB import get_db_connection
            
            with get_db_connection() as conn:
                # Fetch chat_count and token_count from bot_assistants
                select_query = """
                    SELECT chat_count, token_count
                    FROM bot_assistants
                    WHERE chatbot_id = %s;
                """
                result = run_query(conn, select_query, (chatbot_id,))
                if result:
                    chat_count, token_count = result[0]
                else:
                    chat_count, token_count = 0, 0

                # Define limits based on plan
                current_plan = getattr(request, "currentPlan", "Trial")
                if current_plan in ["Starter", "Trial", "Free"]:
                    token_limit = 500_000
                elif current_plan == "Growth":
                    token_limit = 1_000_000
                elif current_plan == "Scale":
                    token_limit = 2_000_000
                else:
                    token_limit = 500_000

                chat_limit = token_limit // 125
                limit_exceed = chat_count >= chat_limit or token_count >= token_limit

            async def event_generator():
                async for chunk in chat_support(
                    user_input=prompt,
                    user_id=user_id,
                    user_email=user_email,
                    chatbot_id=chatbot_id,
                    conversation_id=conversation_id,
                    limit_exceed=limit_exceed,
                    final_response_holder=final_response_holder,
                    user_plan=currentPlan,
                ):
                    if '"event": "complete"' in chunk:
                        response_ready.set()
                    yield chunk
                    await asyncio.sleep(0)

            response = StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )


            # UPDATE CHAT/TOKEN COUNTS IN POSTGRES

            async def finalize_counts():
                await response_ready.wait()
                await asyncio.sleep(0.3)

                prompt_tokens = estimate_tokens(prompt)
                response_tokens = estimate_tokens(final_response_holder["response_text"])
                total_tokens = prompt_tokens + response_tokens

                update_query = """
                    UPDATE bot_assistants
                    SET chat_count = chat_count + 1,
                        token_count = token_count + %s,
                        updated_at = NOW()
                    WHERE chatbot_id = %s;
                """

                # Note: finalize_counts runs in background long after original request scope.
                # We should get a NEW connection from the pool.
                try:
                    with get_db_connection() as conn_update:
                        run_write_query(conn_update, update_query, (total_tokens, chatbot_id))
                except Exception as e:
                    logging.error(f"Error updating token counts: {e}")

            asyncio.create_task(finalize_counts())

        return response

    except Exception as e:
        logging.error(f"Unhandled error in chat_assistant: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


# Endpoint: /chat_history
@router.post("/chat_history")
async def chat_history(request: ChatRequest):
    user_id = request.user_id
    chatbot_id = request.chatbot_id
    conversation_id = request.conversation_id

    print("gpt")

    if user_id and conversation_id:
        try:
            result = get_chat_history(user_id, chatbot_id, conversation_id)

            return {
                "chat_history": result["history"],
                "post_chat_review": result["post_chat_review"]
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    else:
        raise HTTPException(status_code=400, detail="User ID and/or Conversation ID not provided")


# Endpoint: /conversation_by_user_id
@router.post("/conversation_by_user_id")
async def conversation_by_user_id(request: ChatRequest):
    user_id = request.user_id
    chatbot_id = request.chatbot_id

    if user_id and chatbot_id:
        conversation = get_conversation_by_user_id(user_id, chatbot_id)
        if conversation is not None:
            return {"conversation": conversation}
        else:
            raise HTTPException(status_code=500, detail="Unable to retrieve conversation")
    else:
        raise HTTPException(status_code=400, detail="User ID and/or chatbot id not provided")


@router.post("/voice_session")
async def get_session(payload: OrgIdRequest):
    return await generate_openai_ephemeral_session(payload.chatbot_id)

app = FastAPI()
app.include_router(router)
