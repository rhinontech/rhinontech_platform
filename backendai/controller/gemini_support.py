import json
import uuid
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime
from resources.json_data.faq import faq
# from DB.mongodb import conversations_collection

# Load environment variables from .env file
load_dotenv()

# Set your API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

get_response_format = {
    "response": "The answer here. make it small, no need to explain briefly, until if asked to explain particularly",
}

get_no_data_response_format = {
    "response": "NO_DATA"
}

class Chatbot:
    def __init__(self, model_name):
        self.model = genai.GenerativeModel(model_name,
                                           system_instruction=f"You are a uExcelerate coaching platform's AI CHAT BOT. You help people with their queries. Here is the document of all FAQs,\n\n\n.{faq}\n\n Please answer in a very good manner, no need to give a brief explanation. Greet them if required.\n\n")
        self.conversations = {}
        
    def create_conversation(self, user_id, user_role):
        new_conversation_id = str(uuid.uuid4())  # Create a new unique conversation ID
        self.conversations[new_conversation_id] = self.model.start_chat(history=[])
        conversation_data = {
            'conversation_id': new_conversation_id,
            'conversation_title': "",
            'history': []
        }
        conversations_collection.update_one(
            {'user_id': user_id, 'user_role': user_role},
            {'$set': {'conversation': conversation_data}},
            upsert=True
        )
        return new_conversation_id

    def generate_response(self, user_id, user_role, prompt):
        user_data = conversations_collection.find_one({'user_id': user_id, 'user_role': user_role})

        # Create conversation if it doesn't exist
        if not user_data or 'conversation' not in user_data:
            conversation_id = self.create_conversation(user_id, user_role)
            user_data = conversations_collection.find_one({'user_id': user_id, 'user_role': user_role})
        else:
            conversation_id = user_data['conversation']['conversation_id']

        conversation = user_data['conversation']

        # Adjust history to the expected format
        adjusted_history = []
        for entry in conversation['history']:
            adjusted_entry = {
                'parts': [{'text': entry['text']}],  # Create a list of parts containing the text
                'role': 'model' if entry['role'] == 'bot' else entry['role']  # Map 'bot' to 'model'
            }
            adjusted_history.append(adjusted_entry)

        # If conversation is not in the local dictionary, load it
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = self.model.start_chat(history=adjusted_history)

        chat_session = self.conversations[conversation_id]
        content = f"\"{prompt}\", Please you should give me in this below format only. \n\n{json.dumps(get_response_format, indent=4)} \n\n AND if you cant answer or couldn't find the required data then simply say no data like this format. \n\n{json.dumps(get_no_data_response_format, indent=4)}"
        response = chat_session.send_message(content)
        response_json = json.loads(response.text)

        # Extract the 'response.response' field
        action_response = response_json.get('response', '')
        current_time = datetime.utcnow()

        # If action_response is "NO_DATA", set a default response
        if action_response == "NO_DATA":
            action_response = "I'm here to help! Could you please provide more details about your question?"

        if 'raise a ticket' in prompt.lower():
            action_response = "TITLE"
        else:
            # Update conversation history in the database
            conversations_collection.update_one(
                {'user_id': user_id, 'user_role': user_role},
                {'$push': {'conversation.history': {'role': 'user', 'text': prompt, 'timestamp': current_time}}}
            )
            
            conversations_collection.update_one(
                {'user_id': user_id, 'user_role': user_role},
                {'$push': {'conversation.history': {'role': 'bot', 'text': action_response, 'timestamp': current_time}}}
            )

        return action_response

    def generate_title(self, prompt):
        # Simple heuristic to generate a title from the first prompt
        return prompt.split('.')[0]  # Just take the first sentence for example

    def get_chat_history(self, user_id, user_role):
        user_data = conversations_collection.find_one({'user_id': user_id, 'user_role': user_role})
        if user_data and 'conversation' in user_data:
            return user_data['conversation']['history']
        raise ValueError("Conversation not found. Please create a conversation first.")

    def get_conversation_summary(self, user_id, user_role):
        user_data = conversations_collection.find_one({'user_id': user_id, 'user_role': user_role})
        if user_data and 'conversation' in user_data:
            conversation = user_data['conversation']
            last_history_entry = conversation['history'][-1] if conversation['history'] else None
            last_chat_time = last_history_entry['timestamp'] if last_history_entry else None
            return {
                'conversation_id': conversation['conversation_id'],
                'conversation_title': conversation['conversation_title'],
                'last_chat_time': last_chat_time
            }
        return {}


chatbot = Chatbot('gemini-2.5-flash')
