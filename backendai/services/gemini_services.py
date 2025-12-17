
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv() 

# Set your API key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=GOOGLE_API_KEY)

# Create the model
model = genai.GenerativeModel('gemini-2.5-flash')

def chat_gemini(*args):
    response = model.generate_content(args)
    return response