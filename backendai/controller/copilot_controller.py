import json
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Dict, Any

# Load environment variables from .env file
load_dotenv()

# Set your API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

class CopilotController:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.model = genai.GenerativeModel(
            model_name,
            system_instruction="""You are an AI assistant co-pilot that helps support agents with their daily tasks. You work alongside support agents to help them provide better customer service. Your capabilities include:

            - Drafting professional responses to customer inquiries
            - Analyzing customer issues and suggesting solutions
            - Helping with ticket management and prioritization
            - Providing product information and troubleshooting guidance
            - Suggesting escalation paths when appropriate
            - Offering templates and best practices for customer communication

            Communication style:
            - Be helpful, friendly, and professional in your assistance to the support agent
            - Respond directly to the support agent (use "you" when addressing the agent)
            - When referring to customers, use "the customer" or "they/them"
            - Provide clear, actionable advice that the agent can implement
            - Keep responses concise but informative
            - When drafting customer responses, provide them in ready-to-use format
            - Focus on practical solutions that will help resolve customer issues efficiently

            Your role is to make the support agent's job easier and help them provide excellent customer service. If you need more context about a customer issue or situation, ask the support agent for clarification directly."""
        )
        # In-memory session storage (resets when server restarts)
        self.sessions = {}
    
    def create_session(self, session_id: str) -> str:
        """Create a new chat session"""
        self.sessions[session_id] = {
            'chat': self.model.start_chat(history=[]),
            'created_at': datetime.utcnow(),
            'history': []
        }
        return session_id
    
    def get_or_create_session(self, session_id: str):
        """Get existing session or create new one"""
        if session_id not in self.sessions:
            self.create_session(session_id)
        return self.sessions[session_id]
    
    def generate_response(self, session_id: str, prompt: str, context_data: Dict[str, Any] = None):
        """Generate response for the co-pilot with optional context"""
        session = self.get_or_create_session(session_id)
        chat_session = session['chat']
        
        # Prepare the full prompt with context
        full_prompt = self._prepare_prompt_with_context(prompt, context_data)
        
        # Generate response
        response = chat_session.send_message(full_prompt)
        
        # Store in session history
        session['history'].append({
            'role': 'user',
            'message': prompt,
            'timestamp': datetime.utcnow(),
            'context': context_data
        })
        session['history'].append({
            'role': 'assistant', 
            'message': response.text,
            'timestamp': datetime.utcnow()
        })
        
        return response.text
    
    def generate_streaming_response(self, session_id: str, prompt: str, context_data: Dict[str, Any] = None):
        """Generate streaming response for the co-pilot"""
        session = self.get_or_create_session(session_id)
        chat_session = session['chat']
        
        # Prepare the full prompt with context
        full_prompt = self._prepare_prompt_with_context(prompt, context_data)
        
        # Generate streaming response
        response = chat_session.send_message(full_prompt, stream=True)
        
        # Collect full response for history
        full_response = ""
        
        for chunk in response:
            if chunk.text:
                full_response += chunk.text
                yield f"data: {json.dumps({'content': chunk.text, 'done': False})}\n\n"
        
        # Store in session history
        session['history'].append({
            'role': 'user',
            'message': prompt,
            'timestamp': datetime.utcnow(),
            'context': context_data
        })
        session['history'].append({
            'role': 'assistant',
            'message': full_response,
            'timestamp': datetime.utcnow()
        })
        
        # Send completion signal
        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
    
    def _prepare_prompt_with_context(self, prompt: str, context_data: Dict[str, Any] = None) -> str:
        """Prepare prompt with additional context data"""
        if not context_data:
            return prompt
        
        context_str = ""
        
        if 'past_emails' in context_data and context_data['past_emails']:
            context_str += "Previous email context:\n"
            for email in context_data['past_emails'][-3:]:  # Last 3 emails
                context_str += f"• From {email.get('from', 'N/A')}: {email.get('subject', 'N/A')}\n"
                content = email.get('content', 'N/A')
                if len(content) > 150:
                    content = content[:150] + "..."
                context_str += f"  Message: {content}\n"
            context_str += "\n"
        
        if 'past_chats' in context_data and context_data['past_chats']:
            context_str += "Previous conversation:\n"
            for chat in context_data['past_chats'][-5:]:  # Last 5 chat messages
                role = "You" if chat.get('role') == 'assistant' else "User"
                context_str += f"• {role}: {chat.get('message', 'N/A')}\n"
            context_str += "\n"
        
        if 'ticket_info' in context_data and context_data['ticket_info']:
            ticket_info = context_data['ticket_info']
            context_str += f"Current ticket: {ticket_info.get('id', 'N/A')} - {ticket_info.get('subject', 'N/A')} "
            context_str += f"(Status: {ticket_info.get('status', 'N/A')}, Priority: {ticket_info.get('priority', 'N/A')})\n\n"
        
        if context_str:
            return f"{context_str}User request: {prompt}"
        else:
            return prompt
    
    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get chat history for a session"""
        if session_id not in self.sessions:
            return []
        return self.sessions[session_id]['history']
    
    def clear_session(self, session_id: str) -> bool:
        """Clear a specific session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get session information"""
        if session_id not in self.sessions:
            return {'exists': False}
        
        session = self.sessions[session_id]
        return {
            'exists': True,
            'created_at': session['created_at'],
            'message_count': len(session['history'])
        }

# Create global instance
copilot = CopilotController()