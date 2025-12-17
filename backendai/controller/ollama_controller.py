"""
Ollama Controller - Lead Generation Chatbot
Handles training, chat sessions, and lead generation
"""

import json
import os
import logging
import subprocess
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

from services.ollama_services import ollama_client

logger = logging.getLogger(__name__)

# Session storage directory
SESSION_DIR = Path("./data/chat_sessions")
SESSION_DIR.mkdir(parents=True, exist_ok=True)

# Lead generation system prompt
LEAD_GENERATION_SYSTEM = """
You are a friendly customer engagement assistant. Your goal is to naturally collect the following information during conversation:
1. User's name
2. User's contact (phone number OR email)

IMPORTANT RULES:
- Be conversational and natural - don't sound like a form
- Never ask all questions at once
- Ask one thing at a time based on what's missing
- Acknowledge what the user shares before asking for the next piece
- If user volunteers information, acknowledge it warmly
- Once you have name + (phone OR email), proceed to help with their actual question
- Don't be pushy - if they're reluctant, move on to helping them

Current information you have: {lead_status}

Based on what's missing, naturally guide the conversation to collect it. If you have everything, help with their actual request.
"""


class ChatSession:
    """Manages individual chat sessions"""
    
    def __init__(self, session_id: str, organization_id: str):
        self.session_id = session_id
        self.organization_id = organization_id
        self.messages = []
        self.lead_data = {}
        self.current_step = "lead_generation"  # lead_generation or conversation
        self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at
        self.status = "active"  # active, completed, abandoned
        
    def add_message(self, role: str, content: str, metadata: Dict = None):
        """Add a message to the conversation"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        self.updated_at = datetime.now().isoformat()
    
    def extract_lead_info(self, user_message: str):
        """Extract name, phone, email from user message using AI"""
        import re
        
        # Extract phone (10 digits or formatted)
        phone_match = re.search(r'\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', user_message)
        if phone_match and "phone" not in self.lead_data:
            self.lead_data["phone"] = phone_match.group()
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', user_message)
        if email_match and "email" not in self.lead_data:
            self.lead_data["email"] = email_match.group()
        
        # Extract name using AI (only if not already captured)
        if "name" not in self.lead_data:
            # Simple heuristic: capitalized words that aren't common words
            words = user_message.split()
            common_words = {"I", "I'm", "My", "Me", "The", "A", "An", "Hi", "Hello", "Hey"}
            potential_names = [w for w in words if w[0].isupper() and w not in common_words and len(w) > 1]
            
            # Also check for patterns like "I'm X" or "My name is X"
            name_patterns = [
                r"(?:I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
                r"(?:name is|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
                r"(?:call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
                r"^([A-Z][a-z]+)$"  # Single capitalized word as response
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, user_message, re.IGNORECASE)
                if match:
                    self.lead_data["name"] = match.group(1).strip()
                    break
            
            # Fallback to first capitalized word sequence
            if "name" not in self.lead_data and potential_names:
                self.lead_data["name"] = " ".join(potential_names[:2])
    
    def get_lead_status(self) -> str:
        """Get what lead information is missing"""
        missing = []
        if "name" not in self.lead_data:
            missing.append("name")
        if "phone" not in self.lead_data and "email" not in self.lead_data:
            missing.append("contact (phone or email)")
        
        if not missing:
            return "ALL INFORMATION COLLECTED ✓"
        
        collected = []
        if "name" in self.lead_data:
            collected.append(f"name: {self.lead_data['name']}")
        if "phone" in self.lead_data:
            collected.append(f"phone: {self.lead_data['phone']}")
        if "email" in self.lead_data:
            collected.append(f"email: {self.lead_data['email']}")
        
        status = f"Missing: {', '.join(missing)}"
        if collected:
            status += f" | Have: {', '.join(collected)}"
        
        return status
    
    def is_lead_complete(self) -> bool:
        """Check if we have collected lead information"""
        return "name" in self.lead_data and ("phone" in self.lead_data or "email" in self.lead_data)
    
    def to_dict(self) -> Dict:
        """Convert session to dictionary"""
        return {
            "session_id": self.session_id,
            "organization_id": self.organization_id,
            "messages": self.messages,
            "lead_data": self.lead_data,
            "current_step": self.current_step,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "status": self.status
        }
    
    def save(self):
        """Save session to file"""
        session_file = SESSION_DIR / f"{self.session_id}.json"
        with open(session_file, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, session_id: str) -> Optional['ChatSession']:
        """Load session from file"""
        session_file = SESSION_DIR / f"{session_id}.json"
        if not session_file.exists():
            return None
        
        with open(session_file, "r") as f:
            data = json.load(f)
        
        session = cls(data["session_id"], data["organization_id"])
        session.messages = data["messages"]
        session.lead_data = data["lead_data"]
        session.current_step = data["current_step"]
        session.created_at = data["created_at"]
        session.updated_at = data["updated_at"]
        session.status = data["status"]
        
        return session


class OllamaController:
    """Controller for Ollama operations"""
    
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}
    
    def create_session(self, organization_id: str) -> str:
        """Create a new chat session with AI-generated greeting"""
        import uuid
        session_id = str(uuid.uuid4())
        session = ChatSession(session_id, organization_id)
        
        # Generate natural greeting using AI
        system_prompt = LEAD_GENERATION_SYSTEM.format(
            lead_status=session.get_lead_status()
        )
        
        try:
            greeting = ollama_client.generate(
                prompt="Start a friendly conversation with a website visitor. Greet them warmly and ask what brings them here today. Keep it brief (1-2 sentences).",
                system=system_prompt,
                temperature=0.8
            )
        except:
            # Fallback greeting
            greeting = "Hi there! 👋 Welcome! How can I help you today?"
        
        session.add_message("assistant", greeting)
        session.save()
        
        self.sessions[session_id] = session
        return session_id
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get existing session"""
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        # Try to load from file
        session = ChatSession.load(session_id)
        if session:
            self.sessions[session_id] = session
        
        return session
    
    def chat(self, session_id: str, user_message: str, model: str = "rhinon-support") -> Dict:
        """
        Handle chat message with AI-driven lead generation
        
        Returns:
            Dict with assistant response, lead_data, and current_step
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Add user message
        session.add_message("user", user_message)
        
        # Extract lead information from message
        session.extract_lead_info(user_message)
        
        # Check if lead is complete
        if session.is_lead_complete() and session.current_step == "lead_generation":
            session.current_step = "conversation"
        
        # Build system prompt based on lead status
        if session.current_step == "lead_generation":
            # Still collecting lead info - AI guides the conversation
            system_prompt = LEAD_GENERATION_SYSTEM.format(
                lead_status=session.get_lead_status()
            )
        else:
            # Lead complete - normal helpful conversation
            system_prompt = f"""You are a helpful customer service assistant. 
            
User information: {json.dumps(session.lead_data)}

Provide helpful, friendly responses. The user has already shared their contact information, so focus on helping with their questions."""
        
        # Build conversation context
        context = self._build_context(session)
        full_system = f"{system_prompt}\n\n{context}"
        
        # Generate AI response
        try:
            ollama_client.model = model
            response = ollama_client.generate(
                prompt=user_message,
                system=full_system,
                temperature=0.7
            )
            
            session.add_message("assistant", response)
            session.save()
            
            return {
                "response": response,
                "lead_data": session.lead_data,
                "lead_complete": session.is_lead_complete(),
                "current_step": session.current_step
            }
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise
    
    def _build_context(self, session: ChatSession) -> str:
        """Build conversation context"""
        if len(session.messages) <= 2:
            return ""
        
        context = "Recent conversation:\n"
        
        # Include last 6 messages for context (excluding current)
        recent_messages = session.messages[-7:-1] if len(session.messages) > 1 else []
        for msg in recent_messages:
            if msg['role'] != 'system':
                context += f"{msg['role'].title()}: {msg['content']}\n"
        
        return context
    
    def end_session(self, session_id: str) -> Dict:
        """End session and generate summary"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.status = "completed"
        
        # Generate summary
        summary = self._generate_summary(session)
        
        session.add_message("system", f"Summary: {summary}", {"type": "summary"})
        session.save()
        
        return {
            "session_id": session_id,
            "summary": summary,
            "lead_data": session.lead_data,
            "message_count": len(session.messages),
            "duration": session.updated_at
        }
    
    def _generate_summary(self, session: ChatSession) -> str:
        """Generate conversation summary using Ollama"""
        conversation = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in session.messages if msg['role'] != 'system'
        ])
        
        prompt = f"""Summarize this conversation in 2-3 sentences. Focus on:
1. What the user wanted
2. Key information collected
3. Next steps or outcome

Conversation:
{conversation}"""
        
        try:
            summary = ollama_client.generate(
                prompt=prompt,
                system="You are a helpful assistant that creates concise summaries.",
                temperature=0.5
            )
            return summary
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return "Unable to generate summary."
    
    def train_model(self, organization_id: str, instructions: str, knowledge_base: str) -> Dict:
        """
        Train/update custom model for organization
        
        Args:
            organization_id: Organization ID
            instructions: Custom instructions/behavior
            knowledge_base: Knowledge base content
            
        Returns:
            Dict with model name and status
        """
        model_name = f"rhinon-org-{organization_id}"
        modelfile_path = f"./data/modelfiles/Modelfile.{organization_id}"
        
        # Create modelfile directory
        Path("./data/modelfiles").mkdir(parents=True, exist_ok=True)
        
        # Create custom Modelfile
        modelfile_content = f"""# Custom model for Organization {organization_id}

FROM deepseek-r1:1.5b

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_predict 2048

SYSTEM \"\"\"
{instructions}

## Knowledge Base:
{knowledge_base}

Always be helpful, conversational, and natural. Keep responses concise unless more detail is requested.
\"\"\"
"""
        
        # Write Modelfile
        with open(modelfile_path, "w") as f:
            f.write(modelfile_content)
        
        # Create model using Ollama CLI
        try:
            result = subprocess.run(
                ["ollama", "create", model_name, "-f", modelfile_path],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                logger.info(f"Model {model_name} created successfully")
                return {
                    "success": True,
                    "model_name": model_name,
                    "message": "Model trained successfully"
                }
            else:
                logger.error(f"Model creation failed: {result.stderr}")
                return {
                    "success": False,
                    "error": result.stderr
                }
                
        except Exception as e:
            logger.error(f"Training error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_session_history(self, session_id: str) -> Dict:
        """Get full session history"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        return session.to_dict()
    
    def list_sessions(self, organization_id: str = None) -> List[Dict]:
        """List all sessions, optionally filtered by organization"""
        sessions = []
        
        for session_file in SESSION_DIR.glob("*.json"):
            with open(session_file, "r") as f:
                session_data = json.load(f)
                
            if organization_id and session_data["organization_id"] != organization_id:
                continue
            
            sessions.append({
                "session_id": session_data["session_id"],
                "organization_id": session_data["organization_id"],
                "created_at": session_data["created_at"],
                "status": session_data["status"],
                "lead_data": session_data["lead_data"],
                "message_count": len(session_data["messages"])
            })
        
        return sorted(sessions, key=lambda x: x["created_at"], reverse=True)
