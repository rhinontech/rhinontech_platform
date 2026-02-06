"""
Google Cloud Services (GCS) AI Service Layer.

This module provides integration with Google's Generative AI (Gemini) as an alternative
to OpenAI for free trial customers. It includes:
- Chat completion using Gemini 1.5 Flash
- Tool/Function conversion from OpenAI format to Gemini format
- Gemini Live API session configuration for real-time voice
"""

import os
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator

import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool


class GCSServices:
    """
    Google Cloud AI Services for chat and voice.
    
    Provides Gemini-based alternatives to OpenAI services while maintaining
    the same interface and functionality.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            logging.info("✅ GCS Services initialized with Google API Key")
        else:
            logging.warning("⚠️ GOOGLE_API_KEY not found in environment")
    
    def convert_openai_tools_to_gemini(self, openai_tools: List[Dict]) -> Optional[List[Tool]]:
        """
        Convert OpenAI tool format to Gemini function declaration format.
        
        OpenAI format:
        {"type": "function", "function": {"name": "...", "description": "...", "parameters": {...}}}
        
        Gemini format:
        Tool(function_declarations=[FunctionDeclaration(name="...", description="...", parameters={...})])
        
        Args:
            openai_tools: List of tools in OpenAI format
            
        Returns:
            List of Gemini Tool objects, or None if no valid tools
        """
        logging.info(f"🔧 [CONVERT] Input tools: {openai_tools}")
        
        if not openai_tools:
            logging.warning("🔧 [CONVERT] No tools provided (None or empty list)")
            return None
            
        function_declarations = []
        
        for i, tool in enumerate(openai_tools):
            logging.info(f"🔧 [CONVERT] Processing tool {i}: type={tool.get('type')}, keys={list(tool.keys())}")
            if tool.get("type") == "function":
                func = tool.get("function", {})
                
                # Extract function details
                name = func.get("name", "")
                description = func.get("description", "")
                parameters = func.get("parameters", {})
                
                logging.info(f"🔧 [CONVERT] Function: name={name}, desc_len={len(description)}, params_keys={list(parameters.keys()) if parameters else []}")
                
                if name:
                    try:
                        function_declarations.append(FunctionDeclaration(
                            name=name,
                            description=description,
                            parameters=parameters
                        ))
                        logging.info(f"✅ [CONVERT] Successfully converted: {name}")
                    except Exception as e:
                        logging.error(f"❌ [CONVERT] Error converting tool '{name}': {e}")
                        logging.error(f"❌ [CONVERT] Parameters were: {parameters}")
        
        if function_declarations:
            logging.info(f"✅ [CONVERT] Returning {len(function_declarations)} function declarations")
            return [Tool(function_declarations=function_declarations)]
        
        logging.warning(f"⚠️ [CONVERT] No valid function declarations created!")
        return None
    
    async def chat_stream(
        self, 
        messages: List[Dict[str, str]], 
        system_instruction: str = None,
        tools: List[Dict] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator:
        """
        Streaming chat completion using Gemini 1.5 Flash.
        
        Converts OpenAI-style message format to Gemini format and streams responses.
        
        Args:
            messages: List of messages in OpenAI format [{"role": "user/assistant", "content": "..."}]
            system_instruction: System prompt for the model
            tools: List of tools in OpenAI format (will be converted to Gemini format)
            temperature: Generation temperature (0.0 - 1.0)
            
        Yields:
            Response chunks from Gemini
        """
        try:
            # Configure model with system instruction
            model = genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=system_instruction
            )
            
            # Convert tools from OpenAI to Gemini format
            gemini_tools = self.convert_openai_tools_to_gemini(tools)
            if gemini_tools:
                logging.info(f"[GCS DEBUG] Converted {len(tools)} OpenAI tools to Gemini format")
                logging.info(f"[GCS DEBUG] Gemini tools: {gemini_tools}")
            else:
                logging.warning("[GCS DEBUG] No tools converted or tools=None")
            
            # Convert messages to Gemini format
            # Gemini uses "model" instead of "assistant" and requires User/Model alternation.
            gemini_history = []
            
            # Buffer for consecutive user messages
            current_user_parts = []
            
            # Loop all messages except the very last one (which is the current prompt)
            # Actually, standard_rag_controller usually passes full history + prompt as 'messages'.
            # We treat the Last User Message as the active prompt for 'chat.send_message'.
            
            # Identify the last user message index to split History vs Active Prompt
            last_user_idx = -1
            for i in range(len(messages) - 1, -1, -1):
                if messages[i].get("role") == "user":
                    last_user_idx = i
                    break
            
            if last_user_idx == -1:
                # No user message? Edge case.
                last_user_message = ""
            else:
                last_user_message = messages[last_user_idx].get("content", "")
                
            # Build History (Everything BEFORE the last user message)
            for i, msg in enumerate(messages):
                if i == last_user_idx:
                    break # Stop at the active prompt
                
                role = msg.get("role", "user")
                content = msg.get("content", "")
                
                if role == "user":
                    current_user_parts.append(content)
                elif role in ["assistant", "bot"]:
                    # Model message implies User turn ended.
                    if current_user_parts:
                        gemini_history.append({
                            "role": "user",
                            "parts": current_user_parts
                        })
                        current_user_parts = [] # Reset
                    
                    # Add Model message
                    gemini_history.append({
                        "role": "model",
                        "parts": [content]
                    })
            
            # If there are leftover user parts (e.g. user sent 2 msgs, then we stopped before the 3rd one?),
            # Wait, strict alternation means if we have [U, U, M, U(active)], 
            # Loop i=0(U): buffer=[U]. i=1(U): buffer=[U, U]. i=2(M): Add buffer -> Add M.
            # i=3(U-active): Break.
            # Handle edge case where conversation starts with Assistant? (Rare but possible).
            # Gemini requires User first.
            
            # Start chat with history
            try:
                chat = model.start_chat(history=gemini_history)
            except Exception as e:
                # Fallback if history invalid (e.g. empty user parts)
                logging.error(f"Gemini history error: {e}. Starting empty.")
                chat = model.start_chat(history=[])

            # Prepare generation config
            generation_config = {
                "temperature": temperature,
                "max_output_tokens": 2048,
            }
            
            # Send message and stream response
            # Incorporate any "pending" user parts from history loop?
            # If history loop ended with User parts in buffer, we should prepend them to active prompt?
            # Actually, if the structure was [U, U], last_user_idx is 1.
            # i=0(U): buffer=[U]. i=1: Break.
            # We have buffer=[U]. Active=U(2).
            # We should combine them for the final prompt context? 
            # Or add the buffer to history?
            # Gemini history must end with Model? No, start_chat history can end with either?
            # Actually start_chat says "The history should not contain the last message that you want to send."
            # If history ends with User, and we send User -> Error?
            # "The last message in history must be from the model." (Usually).
            
            # Correct Logic: Flush any current_user_parts to history?
            if current_user_parts:
                gemini_history.append({
                    "role": "user",
                    "parts": current_user_parts
                })
                # If we add User to history, next must be Model?
                # But we are about to call chat.send_message(User).
                # This breaks alternation (User -> User).
                # So we MUST prepend these parts to the Last Message.
                full_prompt = "\n\n".join(current_user_parts + [last_user_message])
            else:
                full_prompt = last_user_message

            # Re-init chat if history changed
            # (Simpler: just use full_prompt as the message)
            
            if gemini_history and gemini_history[-1]['role'] == 'user':
                 # This is tricky. If history ends in User, we can't send another User.
                 # We must merge? 
                 # But we just built history.
                 # Let's ensure history loop ALWAYS ends on Model (by flushing on model).
                 # If the loop ends and we have buffer? 
                 # That means [U, U, A, U, U(break)].
                 pass 
                 
            # CLEANER IMPLEMENTATION:
            # Re-calculate history + prompt more robustly.
            # Actually, `ChatSession` manages history statefully? NO, `start_chat` initializes it.
            # We must ensure `history` is valid.
            
            logging.info(f"[GCS DEBUG] Sending message with tools={'YES' if gemini_tools else 'NO'}")
            response = await chat.send_message_async(
                full_prompt,
                generation_config=generation_config,
                tools=gemini_tools,
                stream=True
            )
            logging.info("[GCS DEBUG] Message sent, awaiting response chunks...")
            
            async for chunk in response:
                yield chunk
                
        except Exception as e:
            logging.error(f"Gemini chat_stream error: {e}")
            import json
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    async def generate_title(self, prompt: str) -> str:
        """
        Generates a short, relevant title for the conversation based on the initial prompt.
        Uses Gemini 1.5 Flash for speed.
        """
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            title_prompt = (
                f"Summarize the following user prompt into a very short, concise title (max 6 words). "
                f"Do not use quotes. prompt: {prompt[:500]}"
            )
            response = await model.generate_content_async(title_prompt)
            title = response.text.strip()
            # Safety cleanup
            title = title.replace('"', '').replace("Title:", "").strip()
            return title if title else "New Chat"
        except Exception as e:
            logging.error(f"Error generating title with Gemini: {e}")
            return prompt[:50] + "..." if len(prompt) > 50 else prompt
    
    def get_live_api_config(
        self, 
        instructions: str, 
        tools: List[Dict] = None,
        voice_name: str = "Puck"
    ) -> Dict[str, Any]:
        """
        Create configuration for Gemini Live API session.
        
        This is equivalent to OpenAI's /realtime/sessions endpoint.
        The client uses this config to establish a WebSocket connection.
        
        Args:
            instructions: System instruction for the voice assistant
            tools: List of tools in OpenAI format (will be converted)
            voice_name: Voice to use (Puck, Charon, Kore, Fenrir, Aoede)
            
        Returns:
            Configuration dict for Gemini Live API
        """
        # Build tool definitions for API config directly from dicts
        # (Avoids Protobuf serialization issues with Gemini objects)
        tool_defs = None
        if tools:
            tool_defs = []
            # Gather all function declarations
            funcs = []
            for tool in tools:
                if tool.get("type") == "function":
                    func = tool.get("function", {})
                    funcs.append({
                        "name": func.get("name"),
                        "description": func.get("description"),
                        "parameters": func.get("parameters")
                    })
            
            if funcs:
                tool_defs = [{"function_declarations": funcs}]
        
        config = {
            "model": "models/gemini-2.5-flash-native-audio-latest",
            "generation_config": {
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": voice_name
                        }
                    }
                }
            },
            "system_instruction": {
                "parts": [{"text": instructions}]
            }
        }
        
        if tool_defs:
            config["tools"] = tool_defs
            
        return config
    
    def get_available_voices(self) -> List[str]:
        """
        Get list of available Gemini Live API voices.
        
        Returns:
            List of voice names
        """
        return ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]


# Singleton instance
gcs_services = GCSServices()
