# 🤖 RAG Chatbot Implementation & Testing Plan

**Project:** Healthcare POC - RAG-Based Chatbot  
**Date:** December 20, 2025  
**Goal:** Implement end-to-end RAG chatbot with website/file upload and conversational AI

---

## 📋 Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Database Setup (Local First)](#database-setup-local-first)
3. [Current State Analysis](#current-state-analysis)
4. [Implementation Phases](#implementation-phases)
5. [Testing Plan](#testing-plan)
6. [API Endpoints](#api-endpoints)
7. [Data Flow](#data-flow)

---

## Overview & Architecture

### User Workflow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ADMIN UPLOADS KNOWLEDGE                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Admin uploads website/file via Rhinon Frontend                      │
│     └─> /[role]/automate/knowledge-hub/websites                          │
│     └─> /[role]/automate/knowledge-hub/files                             │
│                                                                          │
│  2. RTServer saves to automations table                                 │
│     └─> POST /api/automations                                            │
│     └─> Saves training_url[], training_pdf[]                             │
│                                                                          │
│  3. RTServer calls BackendAI                                             │
│     └─> POST http://backendai:5002/standard/set_user_assistant          │
│     └─> Payload: { chatbot_id }                                          │
│                                                                          │
│  4. BackendAI processes data                                             │
│     ├─> Fetches URLs/files from automations table                        │
│     ├─> Scrapes website content                                          │
│     ├─> Extracts text from PDFs/docs                                     │
│     ├─> Chunks text (800 chars, 100 overlap)                             │
│     ├─> Generates embeddings (OpenAI text-embedding-3-small)             │
│     └─> Stores in training_chunks table (PostgreSQL + pgvector)          │
│                                                                          │
│  5. Returns success to RTServer → Rhinon                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        VISITOR CHATS WITH BOT                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Visitor opens chatbot widget (rhinonbot-sdk)                         │
│     └─> Single unified chat screen (like WhatsApp)                       │
│     └─> No separate chat history screen                                  │
│                                                                          │
│  2. User sends message                                                   │
│     └─> POST http://backendai:5002/standard/chat                         │
│     └─> Payload: { chatbot_id, user_id, prompt, conversation_id }        │
│                                                                          │
│  3. BackendAI processes query                                            │
│     ├─> Generates query embedding                                        │
│     ├─> Searches training_chunks (cosine similarity)                     │
│     ├─> Retrieves top 5 relevant chunks                                  │
│     ├─> Builds context + user query                                      │
│     └─> Streams GPT-4 response                                           │
│                                                                          │
│  4. SDK displays streaming response                                      │
│     └─> All messages in single screen, grouped by date                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Database Setup (Local First)

### PostgreSQL Setup

#### 1. Install PostgreSQL Locally (Mac)
```bash
# Install via Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb healthcare_local

# Create user
psql postgres
CREATE USER healthadmin WITH PASSWORD 'local123';
ALTER USER healthadmin WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE healthcare_local TO healthadmin;
\q
```

#### 2. Install pgvector Extension
```bash
# Install pgvector
brew install pgvector

# Enable in database
psql -d healthcare_local -U healthadmin
CREATE EXTENSION vector;
\q
```

#### 3. Create Required Tables

**a. training_chunks table (for vector storage)**
```sql
-- Connect to database
psql -d healthcare_local -U healthadmin

-- Create training_chunks table
CREATE TABLE IF NOT EXISTS training_chunks (
    id SERIAL PRIMARY KEY,
    chatbot_id VARCHAR(255) NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),  -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster vector search
CREATE INDEX idx_training_chunks_chatbot ON training_chunks(chatbot_id);
CREATE INDEX idx_training_chunks_embedding ON training_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Verify
\d training_chunks
```

**b. bot_conversations table (for chat history)**
```sql
CREATE TABLE IF NOT EXISTS bot_conversations (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    chatbot_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_conversations_conv_id ON bot_conversations(conversation_id);
CREATE INDEX idx_bot_conversations_chatbot ON bot_conversations(chatbot_id);

-- Verify
\d bot_conversations
```

#### 4. Update Environment Files

**Create `.env.local` in root:**
```bash
# ========================================
# LOCAL DEVELOPMENT ENVIRONMENT
# ========================================

NODE_ENV=development

# ========== RTSERVER ==========
PORT=3000

# JWT
JWT_SECRET=local-dev-secret-key-change-in-prod

# PostgreSQL (Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_local
DB_USERNAME=healthadmin
DB_PASSWORD=local123
DB_SCHEMA=public

# CRM Database (same local for now)
CRM_DB_HOST=localhost
CRM_DB_PORT=5432
CRM_DB_NAME=healthcare_local
CRM_DB_USERNAME=healthadmin
CRM_DB_PASSWORD=local123
CRM_DB_SCHEMA=public

# AWS (Mock/Dev)
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=ap-south-1
S3_BUCKET_NAME=local-healthcare-assets
S3_FOLDER_NAME=uploads

# MongoDB (Optional - can skip for now)
MONGO_URI=mongodb://localhost:27017/chatbot_local
MONGO_URI_KB=mongodb://localhost:27017/kb_local
MONGO_URI_CB=mongodb://localhost:27017/cb_local

# Email (Dev - Use Mailtrap or disable)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_pass

# Razorpay (Test keys)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Frontend URL
FRONT_END_URL=http://localhost:4000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# ========== BACKENDAI ==========
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_API_KEY=your-google-api-key-here

# Logger
LOGGER_FILE=./logs/app_server.log
LOGGER_LEVEL=logging.DEBUG
LOGGER_FORMAT=%(asctime)s %(levelname)s %(name)s : %(message)s

# S3 Base URL (Local mock)
S3_BASE_URL=http://localhost:3000/uploads
```

**Update `backendai/.env`:**
```bash
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_API_KEY=your-google-api-key-here

# PostgreSQL
POSTGRES_HOST=host.docker.internal  # To access Mac's localhost from Docker
POSTGRES_PORT=5432
POSTGRES_DB=healthcare_local
POSTGRES_USER=healthadmin
POSTGRES_PASSWORD=local123

# MongoDB (Optional)
MONGO_URI=mongodb://host.docker.internal:27017/chatbot_local

S3_BASE_URL=http://localhost:3000/uploads
```

#### 5. Update Docker Compose for Local DB

**Update `docker-compose.yml`:**
```yaml
services:
  rtserver:
    build:
      context: ./rtserver
      dockerfile: Dockerfile
    container_name: rtserver
    ports:
      - "3000:3000"
    env_file:
      - .env.local  # Changed from .env.dev
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Allow access to Mac's localhost
    depends_on:
      - backendai
      - redis
    networks:
      - rhinon-network

  backendai:
    build:
      context: ./backendai
      dockerfile: Dockerfile
    container_name: backendai
    ports:
      - "5002:5002"
    env_file:
      - backendai/.env
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Allow access to Mac's localhost
    depends_on:
      - redis
    networks:
      - rhinon-network

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6380:6379"
    networks:
      - rhinon-network

networks:
  rhinon-network:
    driver: bridge
```

#### 6. Run Sequelize Migrations

```bash
# Ensure rtserver can connect to local DB
cd rtserver

# Update config/config.js if needed (should use process.env already)

# Run migrations
npx sequelize-cli db:migrate

# Verify tables created
psql -d healthcare_local -U healthadmin -c "\dt"
```

---

## Current State Analysis

### ✅ What Exists & Works

1. **Frontend (Rhinon)**
   - ✅ Upload UI exists: `/[role]/automate/knowledge-hub/websites`
   - ✅ Upload UI exists: `/[role]/automate/knowledge-hub/files`
   - ✅ Components ready in `@/components/Pages/Automate/Knowledgehub`

2. **Backend (RTServer)**
   - ✅ `automations` table model exists
   - ✅ `automationController.js` exists with CRUD operations
   - ✅ Routes: `/api/automations`
   - ⚠️ AI sync call is **commented out** (lines 107-139)

3. **AI Backend (BackendAI)**
   - ✅ `standard_rag_controller.py` exists
   - ✅ Vector DB ingestion logic implemented
   - ✅ Chunking and embedding functions ready
   - ✅ Routes: `/standard/set_user_assistant`, `/standard/chat`
   - ✅ PostgreSQL + pgvector integration code present

4. **Chatbot SDK**
   - ✅ Chat screen exists
   - ✅ Chat history screen exists
   - ❌ Need to modify to single unified screen

### ❌ What's Missing / Broken

1. **RTServer Issues**
   - ❌ AI sync call to backendai is commented out
   - ❌ No error handling for AI sync failures
   - ❌ No status tracking for training progress

2. **BackendAI Issues**
   - ❌ `training_chunks` table not created
   - ❌ `bot_conversations` table not created
   - ❌ Missing DB helper functions in `DB/postgresDB.py`
   - ❌ Vector search implementation incomplete
   - ❌ No health check endpoint

3. **SDK Issues**
   - ❌ ChatHistoryScreen needs to be removed/hidden
   - ❌ Single unified chat screen not implemented
   - ❌ Date-based message grouping not implemented
   - ❌ Integration with `/standard/chat` endpoint missing

4. **Environment**
   - ❌ Local PostgreSQL not configured
   - ❌ pgvector extension not installed
   - ❌ Environment files need local DB config

---

## Implementation Phases

### Phase 1: Database & Environment Setup (Day 1 - 2 hours)

**Tasks:**
1. ✅ Install PostgreSQL locally
2. ✅ Install pgvector extension
3. ✅ Create `training_chunks` table
4. ✅ Create `bot_conversations` table
5. ✅ Create `.env.local` file
6. ✅ Update `docker-compose.yml`
7. ✅ Test database connection

**Testing:**
```bash
# Test PostgreSQL connection
psql -d healthcare_local -U healthadmin -c "SELECT version();"

# Test pgvector
psql -d healthcare_local -U healthadmin -c "SELECT * FROM pg_extension WHERE extname='vector';"

# Test tables
psql -d healthcare_local -U healthadmin -c "\dt"
```

---

### Phase 2: BackendAI - Vector DB Functions (Day 1 - 3 hours)

**Tasks:**

#### 1. Update `DB/postgresDB.py`

Add missing functions:
```python
def delete_chunks(chatbot_id: str):
    """Delete all chunks for a chatbot"""
    conn = postgres_connection()
    try:
        query = "DELETE FROM training_chunks WHERE chatbot_id = %s;"
        run_write_query(conn, query, (chatbot_id,))
        conn.commit()
    except Exception as e:
        logging.error(f"Error deleting chunks: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def insert_chunk_batch(chatbot_id: str, chunks_data: list):
    """Insert multiple chunks in batch"""
    conn = postgres_connection()
    try:
        query = """
            INSERT INTO training_chunks (chatbot_id, chunk_index, content, embedding)
            VALUES (%s, %s, %s, %s);
        """
        for chunk in chunks_data:
            run_write_query(
                conn, 
                query, 
                (chatbot_id, chunk['index'], chunk['content'], chunk['embedding'])
            )
        conn.commit()
    except Exception as e:
        logging.error(f"Error inserting chunks: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def search_vectors(chatbot_id: str, query_embedding: list, top_k: int = 5) -> list:
    """Search for similar vectors using cosine similarity"""
    conn = postgres_connection()
    try:
        # Convert embedding to PostgreSQL vector format
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        query = f"""
            SELECT content, 1 - (embedding <=> %s::vector) AS similarity
            FROM training_chunks
            WHERE chatbot_id = %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s;
        """
        result = run_query(conn, query, (embedding_str, chatbot_id, embedding_str, top_k))
        return result
    except Exception as e:
        logging.error(f"Error searching vectors: {e}")
        return []
    finally:
        conn.close()

def save_bot_message(conversation_id: str, chatbot_id: str, user_id: str, 
                     user_email: str, role: str, content: str):
    """Save a message to bot_conversations"""
    conn = postgres_connection()
    try:
        query = """
            INSERT INTO bot_conversations 
            (conversation_id, chatbot_id, user_id, user_email, role, content)
            VALUES (%s, %s, %s, %s, %s, %s);
        """
        run_write_query(conn, query, 
                       (conversation_id, chatbot_id, user_id, user_email, role, content))
        conn.commit()
    except Exception as e:
        logging.error(f"Error saving message: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def get_conversation_history(conversation_id: str, limit: int = 10) -> list:
    """Get recent conversation history"""
    conn = postgres_connection()
    try:
        query = """
            SELECT role, content, created_at
            FROM bot_conversations
            WHERE conversation_id = %s
            ORDER BY created_at DESC
            LIMIT %s;
        """
        result = run_query(conn, query, (conversation_id, limit))
        # Reverse to get chronological order
        return list(reversed(result))
    except Exception as e:
        logging.error(f"Error getting history: {e}")
        return []
    finally:
        conn.close()
```

#### 2. Update `controller/standard_rag_controller.py`

Fix the vector search and chat logic:
```python
@staticmethod
async def chat_with_rag(chatbot_id: str, user_id: str, user_email: str, 
                        conversation_id: str, prompt: str):
    """
    RAG-based chat:
    1. Get conversation history
    2. Generate embedding for user query
    3. Search vector DB for relevant chunks
    4. Build context
    5. Stream GPT-4 response
    6. Save messages
    """
    from DB.postgresDB import (
        get_conversation_history, 
        search_vectors, 
        save_bot_message
    )
    
    # 1. Get history
    history = await asyncio.to_thread(
        get_conversation_history, conversation_id, limit=10
    )
    
    # 2. Generate query embedding
    query_embedding = embedding_service.embed_text(prompt)
    
    # 3. Search vector DB
    relevant_chunks = await asyncio.to_thread(
        search_vectors, chatbot_id, query_embedding, top_k=5
    )
    
    # 4. Build context
    context = "\n\n".join([chunk[0] for chunk in relevant_chunks])
    
    # 5. Build messages for GPT
    messages = [
        {
            "role": "system",
            "content": f"""You are a helpful healthcare assistant. 
Use the following knowledge base to answer questions:

{context}

If the answer is not in the knowledge base, say so politely."""
        }
    ]
    
    # Add history
    for role, content, _ in history:
        messages.append({"role": role, "content": content})
    
    # Add current query
    messages.append({"role": "user", "content": prompt})
    
    # 6. Save user message
    await asyncio.to_thread(
        save_bot_message,
        conversation_id, chatbot_id, user_id, user_email, "user", prompt
    )
    
    # 7. Stream response
    full_response = ""
    async for chunk in StandardRAGController._stream_gpt_response(messages):
        full_response += chunk
        yield chunk
    
    # 8. Save assistant message
    await asyncio.to_thread(
        save_bot_message,
        conversation_id, chatbot_id, user_id, user_email, "assistant", full_response
    )

@staticmethod
async def _stream_gpt_response(messages: list):
    """Stream GPT-4 response"""
    try:
        stream = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=1000
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        logging.error(f"Error streaming GPT response: {e}")
        yield f"Error: {str(e)}"
```

#### 3. Update `routes/standard_rag_routes.py`

Fix the chat route:
```python
@router.post("/standard/chat")
async def chat_standard(request: ChatRequest):
    """
    Stream chat response with RAG context
    """
    user_id = request.user_id
    user_email = request.user_email
    chatbot_id = request.chatbot_id
    conversation_id = request.conversation_id
    prompt = request.prompt

    if not all([chatbot_id, conversation_id, prompt]):
        raise HTTPException(
            status_code=400, 
            detail="chatbot_id, conversation_id, and prompt are required"
        )

    async def stream_response():
        try:
            async for chunk in standard_rag_controller.chat_with_rag(
                chatbot_id, user_id, user_email, conversation_id, prompt
            ):
                yield chunk
        except Exception as e:
            logging.error(f"Chat error: {e}")
            yield f"Error: {str(e)}"

    return StreamingResponse(
        stream_response(),
        media_type="text/plain"
    )
```

#### 4. Add health check endpoint

In `backendai/main.py`:
```python
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "backendai",
        "timestamp": datetime.now().isoformat()
    }
```

**Testing:**
```bash
# Test health endpoint
curl http://localhost:5002/health

# Test set_user_assistant (after automations data exists)
curl -X POST http://localhost:5002/standard/set_user_assistant \
  -H "Content-Type: application/json" \
  -d '{"chatbot_id": "test-chatbot-123"}'

# Check training_chunks table
psql -d healthcare_local -U healthadmin \
  -c "SELECT chatbot_id, COUNT(*) FROM training_chunks GROUP BY chatbot_id;"
```

---

### Phase 3: RTServer - Enable AI Sync (Day 1 - 1 hour)

**Tasks:**

#### 1. Uncomment & Fix AI Sync in `automationController.js`

```javascript
// STEP 3: Sync to AI Engine (RAG)
try {
  const pythonBackendUrl = 
    process.env.AI_BACKEND_URL || "http://backendai:5002";
  
  const { chatbots } = require("../models");
  const chatbot = await chatbots.findOne({ where: { organization_id } });

  if (chatbot) {
    const payload = {
      chatbot_id: chatbot.chatbot_id,
    };

    // Call AI backend to process and store in vector DB
    const response = await axios.post(
      `${pythonBackendUrl}/standard/set_user_assistant`, 
      payload,
      { timeout: 60000 } // 60 second timeout
    );
    
    console.log("✓ Successfully synced data to AI Brain:", response.data);
    
    // Update automation status
    automation.is_chatbot_trained = true;
    await automation.save();
    
  } else {
    console.warn("No chatbot found for this org, skipped AI sync");
  }
} catch (aiError) {
  console.error("Failed to sync with AI Backend:", aiError.message);
  // Don't fail the main request, just log
  // Frontend will show upload success, training happens async
}
```

#### 2. Add health check to `rtserver/app.js`

```javascript
// Add before other routes
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ 
      status: 'healthy', 
      service: 'rtserver',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'rtserver',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

**Testing:**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test automation upload (via Postman or frontend)
# Should trigger AI sync automatically
```

---

### Phase 4: Rhinon Frontend - Upload Testing (Day 2 - 2 hours)

**Tasks:**

#### 1. Test Website Upload Flow

Navigate to: `http://localhost:4000/[role]/automate/knowledge-hub/websites?addWebsite=true`

Steps:
1. Enter website URL (e.g., https://example.com)
2. Enable/disable sitemap scraping
3. Click "Add Website"
4. Verify API call to `/api/automations`
5. Check backend logs for AI sync

#### 2. Test File Upload Flow

Navigate to: `http://localhost:4000/[role]/automate/knowledge-hub/files?addFile=true`

Steps:
1. Upload PDF/DOC file
2. Click "Add File"
3. Verify file uploaded to S3 (or local mock)
4. Verify API call to `/api/automations`
5. Check backend logs for AI sync

#### 3. Verify Vector DB

```bash
# Check if chunks were created
psql -d healthcare_local -U healthadmin -c "
  SELECT chatbot_id, COUNT(*) as chunk_count 
  FROM training_chunks 
  GROUP BY chatbot_id;
"

# View sample chunks
psql -d healthcare_local -U healthadmin -c "
  SELECT chatbot_id, chunk_index, LEFT(content, 100) as preview
  FROM training_chunks
  LIMIT 5;
"
```

**Expected Behavior:**
- ✅ Upload UI works
- ✅ Data saved to `automations` table
- ✅ AI backend called automatically
- ✅ Chunks appear in `training_chunks` table
- ✅ Success message shown to user

---

### Phase 5: SDK - Unified Chat Screen (Day 2 - 3 hours)

**Tasks:**

#### 1. Modify Navigation to Hide Chat History

Update `rhinonbot-sdk/src/Messenger/Messenger.tsx`:

```typescript
// Remove ChatHistoryScreen from navigation options
const navigationOptions = chatbot_config?.navigationOptions || ['Home', 'Chats', 'Help'];

// Filter out 'Chats' option (which shows history)
// Keep only unified chat
const filteredNav = navigationOptions.filter(opt => opt !== 'Chats');
```

#### 2. Modify ChatScreen to Show All Messages

Update `rhinonbot-sdk/src/Messenger/ChatScreen/ChatScreen.tsx`:

Add date grouping logic:
```typescript
// Group messages by date
const groupMessagesByDate = (messages: Message[]) => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(msg => {
    const date = new Date(msg.timestamp);
    const dateKey = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
  });
  
  return groups;
};

// Render grouped messages
const messageGroups = groupMessagesByDate(messages);

return (
  <div className="chat-messages">
    {Object.entries(messageGroups).map(([date, msgs]) => (
      <div key={date}>
        <div className="date-separator">{date}</div>
        {msgs.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    ))}
  </div>
);
```

#### 3. Update Chat API Integration

Update `rhinonbot-sdk/tools/services/AiRinoAssisstant/AiRhinoConvoServices.tsx`:

```typescript
export const sendMessageToAI = async (
  chatbotId: string,
  userId: string,
  conversationId: string,
  message: string
) => {
  const response = await fetch(
    `${AI_API_URL}/standard/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatbot_id: chatbotId,
        user_id: userId,
        conversation_id: conversationId,
        prompt: message,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  // Return reader for streaming
  return response.body?.getReader();
};
```

#### 4. Implement Streaming Response Handling

```typescript
const handleSendMessage = async (message: string) => {
  setIsLoading(true);
  
  try {
    const reader = await sendMessageToAI(
      chatbotId,
      userId,
      conversationId,
      message
    );

    if (!reader) return;

    let accumulatedText = '';
    const decoder = new TextDecoder();

    // Add user message immediately
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Create placeholder for assistant response
    const assistantMsgId = Date.now() + 1;
    addMessage({
      id: assistantMsgId.toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    });

    // Stream response
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      accumulatedText += chunk;
      
      // Update assistant message
      updateMessage(assistantMsgId.toString(), {
        content: accumulatedText,
      });
    }

    // Mark streaming complete
    updateMessage(assistantMsgId.toString(), {
      isStreaming: false,
    });

  } catch (error) {
    console.error('Chat error:', error);
    showError('Failed to send message');
  } finally {
    setIsLoading(false);
  }
};
```

**Testing:**
```bash
# Build SDK
cd rhinonbot-sdk
npm run build

# Test in browser
# Open widget, send message, verify:
# - Single chat screen (no separate history)
# - Messages grouped by date
# - Streaming response works
# - All conversation in one place
```

---

### Phase 6: End-to-End Testing (Day 2 - 2 hours)

**Complete Workflow Test:**

#### Test Case 1: Website Upload & Chat

```
1. Admin Actions:
   ✓ Navigate to /automate/knowledge-hub/websites
   ✓ Add website: https://www.healthcare-example.com
   ✓ Wait for "Success" message
   ✓ Verify in DB: SELECT * FROM automations;
   ✓ Verify chunks: SELECT COUNT(*) FROM training_chunks WHERE chatbot_id='xxx';

2. Visitor Actions:
   ✓ Open chatbot widget
   ✓ Send: "What services do you offer?"
   ✓ Verify streaming response appears
   ✓ Response should contain info from website
   ✓ Send follow-up: "What are your hours?"
   ✓ Verify context is maintained

3. Validation:
   ✓ Check bot_conversations table has both messages
   ✓ Check console logs show vector search happening
   ✓ Verify response is relevant to uploaded content
```

#### Test Case 2: PDF Upload & Chat

```
1. Admin Actions:
   ✓ Navigate to /automate/knowledge-hub/files
   ✓ Upload healthcare PDF (e.g., patient guide)
   ✓ Wait for "Success" message
   ✓ Verify chunks created for PDF content

2. Visitor Actions:
   ✓ Open chatbot widget
   ✓ Send: "What information is in the patient guide?"
   ✓ Verify response contains PDF content
   ✓ Test with specific questions from PDF

3. Validation:
   ✓ Response accuracy
   ✓ Streaming works properly
   ✓ All messages saved to DB
```

#### Test Case 3: Multiple Sources

```
1. Upload multiple sources:
   ✓ Website A
   ✓ Website B
   ✓ PDF document
   ✓ Article content

2. Chat testing:
   ✓ Ask questions that require info from different sources
   ✓ Verify RAG retrieves correct relevant chunks
   ✓ Verify responses synthesize multiple sources
```

---

## Testing Plan

### Unit Tests

#### Backend AI Tests
```python
# test_rag_controller.py
import pytest
from controller.standard_rag_controller import StandardRAGController

def test_chunk_text():
    text = "A" * 1000
    chunks = StandardRAGController.chunk_text(text, chunk_size=100, overlap=20)
    assert len(chunks) > 0
    assert len(chunks[0]) <= 100

def test_ingest_to_vector_db():
    # Mock test
    chatbot_id = "test-123"
    # Test ingestion process
    pass

def test_chat_with_rag():
    # Mock test
    # Test RAG chat flow
    pass
```

#### RTServer Tests
```javascript
// automation.test.js
const request = require('supertest');
const app = require('../app');

describe('Automation API', () => {
  it('should create automation', async () => {
    const response = await request(app)
      .post('/api/automations')
      .send({
        training_url: [{ url: 'https://example.com' }]
      })
      .expect(200);
    
    expect(response.body.automation).toBeDefined();
  });
});
```

### Integration Tests

#### Database Tests
```sql
-- Test vector search
SELECT content, 
       1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM training_chunks
WHERE chatbot_id = 'test-123'
ORDER BY similarity DESC
LIMIT 5;
```

#### API Tests
```bash
# Test complete flow
./test_rag_workflow.sh
```

### Manual Testing Checklist

- [ ] Upload website via frontend
- [ ] Upload PDF via frontend
- [ ] Verify automations table updated
- [ ] Verify training_chunks created
- [ ] Open chatbot widget
- [ ] Send chat message
- [ ] Verify streaming response
- [ ] Verify response relevance
- [ ] Check conversation history in DB
- [ ] Test multiple follow-up questions
- [ ] Test with no knowledge base data
- [ ] Test error handling

---

## API Endpoints

### RTServer (Port 3000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/automations` | GET | Get automations for org |
| `/api/automations` | POST | Create/update automation + trigger AI sync |

### BackendAI (Port 5002)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/standard/set_user_assistant` | POST | Process & store in vector DB |
| `/standard/chat` | POST | RAG chat with streaming |

---

## Data Flow

### Upload Flow
```
Frontend Form
    ↓ (POST /api/automations)
RTServer automationController
    ↓ (Save to DB)
automations table
    ↓ (POST /standard/set_user_assistant)
BackendAI standard_rag_controller
    ↓ (Fetch, chunk, embed)
training_chunks table (with vectors)
    ↓ (Return success)
Frontend Success Message
```

### Chat Flow
```
SDK Chat Input
    ↓ (POST /standard/chat)
BackendAI chat_with_rag
    ↓ (Embed query)
Embedding Service
    ↓ (Vector search)
training_chunks table
    ↓ (Build context + GPT)
OpenAI GPT-4
    ↓ (Stream response)
SDK Display
    ↓ (Save messages)
bot_conversations table
```

---

## Success Criteria

### Phase 1-2: Backend Ready
- [ ] PostgreSQL running locally
- [ ] pgvector extension installed
- [ ] Tables created and verified
- [ ] Docker containers connect to local DB
- [ ] BackendAI health check passes
- [ ] RTServer health check passes

### Phase 3-4: Upload & Processing Works
- [ ] Can upload website URL
- [ ] Can upload PDF file
- [ ] Data saved to automations table
- [ ] AI sync triggered automatically
- [ ] Chunks appear in training_chunks table
- [ ] Vector embeddings stored correctly

### Phase 5-6: Chat Works
- [ ] SDK shows unified chat screen
- [ ] Can send messages
- [ ] Streaming responses work
- [ ] Responses are relevant to uploaded content
- [ ] Messages grouped by date
- [ ] Conversation history maintained
- [ ] All messages saved to bot_conversations

---

## Troubleshooting Guide

### Common Issues

**Issue 1: Docker can't connect to PostgreSQL**
```bash
# Solution: Use host.docker.internal
# In backendai/.env:
POSTGRES_HOST=host.docker.internal
```

**Issue 2: pgvector extension not found**
```bash
# Reinstall pgvector
brew reinstall pgvector
psql -d healthcare_local -U healthadmin -c "CREATE EXTENSION vector;"
```

**Issue 3: Embeddings dimension mismatch**
```python
# Verify OpenAI embedding model
# text-embedding-3-small = 1536 dimensions
# Update table if needed:
ALTER TABLE training_chunks ALTER COLUMN embedding TYPE VECTOR(1536);
```

**Issue 4: AI sync not triggering**
```javascript
// Check RTServer logs
docker logs rtserver -f

// Verify endpoint reachable
curl http://backendai:5002/health
```

**Issue 5: Chat not streaming**
```typescript
// Check response headers
// Ensure: media_type="text/plain" in FastAPI
// Ensure: fetch with proper headers in SDK
```

---

## Next Steps After Implementation

1. **Performance Optimization**
   - Add caching for vector searches
   - Batch embed API calls
   - Index optimization

2. **Enhanced Features**
   - Multi-language support
   - Source citations in responses
   - Admin dashboard for training status

3. **Production Ready**
   - Add rate limiting
   - Implement proper error handling
   - Add monitoring & logging
   - Setup CI/CD

4. **Security**
   - Add authentication for AI endpoints
   - Validate file uploads
   - Sanitize user inputs

---

**Ready to Start?** Begin with Phase 1: Database & Environment Setup!

