import os
from pymongo import MongoClient
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv() 

# Construct the MongoDB URI
MONGO_URI = os.getenv("MONGO_URI")

# Now you can use the encoded MONGO_URI to create the MongoClient
client = MongoClient(MONGO_URI)
db = client['chatbot']

# already changed to bot_conversarion in postress 
conversations_collection = db['conversations']

assistant_collection = db['assistants']
# chatbot_config_collection = db['chatbot_config']

# # Verify connection
# try:
#     # The ismaster command is cheap and does not require auth
#     client.admin.command('ismaster')
#     print("MongoDB connection successful")
# except Exception as e:
#     print(f"MongoDB connection error: {e}")
