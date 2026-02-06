import google.generativeai as genai
import os

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Try reading from sampleenv.txt if env var not set in shell
    # Try reading from ../.env.dev
    try:
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.dev')
        print(f"Checking {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip().startswith('GOOGLE_API_KEY='):
                    api_key = line.strip().split('=', 1)[1].strip('"').strip("'")
                    print("Found API Key in .env.dev")
                    break
    except Exception as e:
        print(f"Failed to read .env.dev: {e}")

if not api_key:
    print("Error: No API Key found.")
    exit(1)

genai.configure(api_key=api_key)

print("Listing supported models for BidiGenerateContent...")
try:
    # List all models
    for m in genai.list_models():
        print(f"Model: {m.name}")
        print(f"Supported methods: {m.supported_generation_methods}")
        if 'bidiGenerateContent' in m.supported_generation_methods or 'generateContent' in m.supported_generation_methods:
             print(f"   -> Potential Candidate: {m.name}")
        print("-" * 20)
except Exception as e:
    print(f"Error listing models: {e}")
