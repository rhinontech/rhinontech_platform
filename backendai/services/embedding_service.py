from openai import OpenAI
import os
import logging

logger = logging.getLogger(__name__)

class OpenAIEmbeddingService:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenAIEmbeddingService, cls).__new__(cls)
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.error("OPENAI_API_KEY not found in environment variables.")
            cls._client = OpenAI(api_key=api_key)
        return cls._instance

    def embed_text(self, text: str):
        if not text:
            return []
        
        try:
            # text-embedding-3-small is cost effective and high performance (1536 dim)
            response = self._client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []

# Global instance
embedding_service = OpenAIEmbeddingService()
