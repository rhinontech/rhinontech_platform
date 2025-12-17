import os

from dotenv import load_dotenv
from openai import OpenAI


# Load environment variables from .env file
load_dotenv() 

# Now you can use the API key
client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))

def chat_completion(messages):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        response_format={"type": "json_object"},
        messages=messages
    )
    return response
