"""
AI Provider Abstraction Layer
Allows easy switching between OpenAI, Gemini, and Ollama (local AI)
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import os
from services.openai_services import client as openai_client
from services.gemini_services import model as gemini_model
from services.ollama_services import ollama_client


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    def generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generate content from a prompt"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider name"""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI GPT implementation"""
    
    def __init__(self, model: str = "gpt-4o-mini"):
        self.model = model
        self.client = openai_client
    
    def generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generate content using OpenAI Chat Completion"""
        messages = []
        
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=4000
        )
        
        return response.choices[0].message.content
    
    def get_provider_name(self) -> str:
        return f"OpenAI ({self.model})"


class GeminiProvider(AIProvider):
    """Google Gemini implementation"""
    
    def __init__(self):
        self.model = gemini_model
    
    def generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generate content using Gemini"""
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"{system_instruction}\n\n{prompt}"
        
        response = self.model.generate_content(full_prompt)
        return response.text
    
    def get_provider_name(self) -> str:
        return "Google Gemini"


class OllamaProvider(AIProvider):
    """Ollama Local AI implementation (supports phi3, deepseek-r1, llama3, mistral, etc.)"""
    
    def __init__(self, model: str = "deepseek-r1:1.5b"):
        self.model = model
        self.client = ollama_client
        self.client.model = model
    
    def generate_content(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generate content using Ollama local model"""
        return self.client.generate(
            prompt=prompt,
            system=system_instruction,
            stream=False,
            temperature=0.7
        )
    
    def get_provider_name(self) -> str:
        return f"Ollama ({self.model})"
    
    def stream_generate(self, prompt: str, system_instruction: Optional[str] = None):
        """Stream generation for real-time responses"""
        return self.client.stream_generate(
            prompt=prompt,
            system=system_instruction
        )


# Provider Factory
def get_ai_provider(provider_name: Optional[str] = None) -> AIProvider:
    """
    Get AI provider instance based on configuration
    
    Args:
        provider_name: Override provider ('openai' | 'gemini' | 'ollama')
    
    Returns:
        AIProvider instance
    """
    if provider_name is None:
        provider_name = os.getenv("AI_PROVIDER", "ollama").lower()  # Default to Ollama!
    
    if provider_name == "openai":
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return OpenAIProvider(model=model)
    elif provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "ollama":
        model = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
        return OllamaProvider(model=model)
    else:
        raise ValueError(f"Unknown AI provider: {provider_name}. Supported: openai, gemini, ollama")


# Convenience function
def generate_ai_content(prompt: str, system_instruction: Optional[str] = None, provider: Optional[str] = None) -> str:
    """
    Generate AI content using configured provider
    
    Args:
        prompt: User prompt
        system_instruction: System instruction (optional)
        provider: Override provider ('openai' | 'gemini' | 'ollama')
    
    Returns:
        Generated content as string
    """
    ai_provider = get_ai_provider(provider)
    return ai_provider.generate_content(prompt, system_instruction)


# Provider availability check with fallback
def get_ai_provider_with_fallback(preferred: str = "ollama") -> AIProvider:
    """
    Get provider with automatic fallback to OpenAI if preferred fails
    
    Args:
        preferred: Preferred provider name
    
    Returns:
        AIProvider instance
    """
    try:
        provider = get_ai_provider(preferred)
        # Test if Ollama is available
        if preferred == "ollama":
            if not ollama_client.is_available():
                import logging
                logging.warning("Ollama not available, falling back to OpenAI")
                return get_ai_provider("openai")
        return provider
    except Exception as e:
        import logging
        logging.error(f"Failed to get {preferred}, falling back to OpenAI: {e}")
        return get_ai_provider("openai")
