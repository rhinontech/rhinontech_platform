from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import copilot_routes
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime, timezone


from routes.rhinon_ai_chatbot import router as rhinon_ai_router 
from routes.gemini_support_routes import router as gemini_support_route
from routes.gpt_support_routes import router as gpt_support_route
from routes.copilot_routes import router as copilot_route
from routes.linkedin_ai_routes import router as linkedin_ai_route
from routes.image_generation_routes import router as image_generation_route
from routes.ollama_routes import router as ollama_route

from DB.mongodb import client as mongo_client
from DB.postgresDB import postgres_connection

pg_conn = None 

# Lifespan event: handles startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    global pg_conn

    # Connect to MongoDB
    try:
        mongo_client.admin.command('ismaster')
        print("MongoDB connection successful")
    except Exception as e:
        print(f"MongoDB connection error: {e}")

    # Connect to PostgreSQL
    try:
        pg_conn = postgres_connection()
        if pg_conn:
            print("PostgreSQL connection successful")
        else:
            print("Failed to connect to PostgreSQL - will retry on demand")
    except Exception as e:
        print(f"PostgreSQL connection error: {e} - will retry on demand")

    yield 

    # Shutdown logic
    mongo_client.close()
    print("MongoDB connection closed")

    if pg_conn:
        pg_conn.close()
        print("PostgreSQL connection closed")

# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.get("/hello")
def read_root():
    return {"message": "Hello, World!"}

@app.get("/health")
def health_check():
    """
    Health check endpoint - checks PostgreSQL and OpenAI API availability
    """
    from DB.postgresDB import check_db_health
    import os
    
    health_status = {
        "service": "backendai",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {}
    }
    
    # Check PostgreSQL
    db_health = check_db_health()
    health_status["checks"]["postgresql"] = db_health
    
    # Check OpenAI API Key
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key != "your_openai_api_key_here":
        health_status["checks"]["openai"] = {"status": "configured"}
    else:
        health_status["checks"]["openai"] = {"status": "not_configured"}
    
    # Overall status
    if db_health["status"] != "healthy":
        health_status["status"] = "degraded"
    
    return health_status

# Include your routers
app.include_router(rhinon_ai_router, prefix="/api", tags=["Assistant for WebApp"])
app.include_router(gpt_support_route,tags=["gpt for Chatbot"])
app.include_router(copilot_route, tags=["Copilot"])
app.include_router(linkedin_ai_route, prefix="/api", tags=["LinkedIn AI Automation"])
app.include_router(image_generation_route, tags=["Image Generation"])
app.include_router(ollama_route, tags=["Ollama Lead Generation"])
# app.include_router(gemini_support_route, tags=["Gemini"])

# New Routes for RAG Migration
from routes.standard_rag_routes import router as standard_rag_route
from routes.realtime_rag_routes import router as realtime_rag_route
app.include_router(standard_rag_route, tags=["Standard RAG (OpenAI)"])
app.include_router(realtime_rag_route, tags=["Realtime API"])


# Run with: python main.py
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5002, reload=True)