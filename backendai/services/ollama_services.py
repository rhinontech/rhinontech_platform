"""
Ollama Service - Local AI Model Integration
Supports any Ollama model (phi3, deepseek-r1, llama3, mistral, etc.)
"""

import requests
import json
from typing import Generator, Optional
import logging
import os

logger = logging.getLogger(__name__)

class OllamaClient:
    """Client for Ollama API"""
    
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = model or os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
        self.generate_url = f"{self.base_url}/api/generate"
        self.chat_url = f"{self.base_url}/api/chat"
    
    def generate(
        self, 
        prompt: str, 
        system: Optional[str] = None,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 4000
    ) -> str:
        """
        Generate completion from prompt
        
        Args:
            prompt: User prompt
            system: System instruction (optional)
            stream: Whether to stream response
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            
        Returns:
            Generated text
        """
        # Build full prompt with system instruction
        full_prompt = prompt
        if system:
            full_prompt = f"{system}\n\nUser: {prompt}\nAssistant:"
        
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        try:
            response = requests.post(
                self.generate_url,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            if stream:
                return response  # Return response object for streaming
            else:
                result = response.json()
                return result.get("response", "")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API error: {e}")
            raise Exception(f"Failed to generate content: {str(e)}")
    
    def chat(
        self,
        messages: list,
        stream: bool = False,
        temperature: float = 0.7
    ) -> str:
        """
        Chat completion API (supports conversation history)
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            stream: Whether to stream response
            temperature: Sampling temperature
            
        Returns:
            Generated response
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature
            }
        }
        
        try:
            response = requests.post(
                self.chat_url,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            if stream:
                return response
            else:
                result = response.json()
                return result.get("message", {}).get("content", "")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama chat API error: {e}")
            raise Exception(f"Failed to chat: {str(e)}")
    
    def stream_generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.7
    ) -> Generator[str, None, None]:
        """
        Stream generation response
        
        Yields:
            Text chunks as they're generated
        """
        full_prompt = prompt
        if system:
            full_prompt = f"{system}\n\nUser: {prompt}\nAssistant:"
        
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": True,
            "options": {
                "temperature": temperature
            }
        }
        
        try:
            response = requests.post(
                self.generate_url,
                json=payload,
                stream=True,
                timeout=60
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if "response" in chunk:
                            yield chunk["response"]
                    except json.JSONDecodeError:
                        continue
                        
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama streaming error: {e}")
            raise Exception(f"Failed to stream: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if Ollama server is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False


# Global client instance
ollama_client = OllamaClient()
