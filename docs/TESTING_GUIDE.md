# 🧪 Complete Testing Guide - Phases 4, 5 & 6

**Date:** December 20, 2025  
**Purpose:** Step-by-step guide to test the complete RAG chatbot system

---

## Prerequisites ✅

All backend services must be running:

```bash
# Check services
docker ps
# Should show: backendai, rtserver, redis

# Check PostgreSQL
psql -d healthcare_local -U healthadmin -c "SELECT version();"

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:5002/health
```

---

## Phase 4: Rhinon Frontend Upload Testing

### Step 1: Start Rhinon Dashboard

```bash
cd rhinon
npm run dev
```

**Expected Output:**
```
✓ Ready in X seconds
○ Local: http://localhost:4000
```

### Step 2: Login to Dashboard

1. Navigate to: `http://localhost:4000`
2. Login with your credentials (or sign up if needed)
3. You should land on the dashboard

### Step 3: Navigate to Knowledge Hub

**URL:** `http://localhost:4000/[your-role]/automate/knowledge-hub`

Where `[your-role]` is typically: `admin`, `owner`, `manager`, etc.

### Step 4: Test Website Upload

1. Click on **"Websites"** tab (or navigate to `/knowledge-hub/websites`)
2. Click **"Add Website"** button
3. Enter test website URL:
   ```
   https://en.wikipedia.org/wiki/Healthcare
   ```
4. (Optional) Enable/disable sitemap scraping
5. Click **"Add"** or **"Save"**

**What to Check:**
- ✅ Success message appears
- ✅ Website shows in list
- ✅ No error messages

**Backend Verification:**
```bash
# Check automations table
psql -d healthcare_local -U healthadmin -c "
  SELECT id, organization_id, training_url, is_chatbot_trained 
  FROM automations 
  ORDER BY id DESC 
  LIMIT 1;
"

# Check if AI sync triggered (check logs)
docker logs rtserver --tail 50 | grep "AI"

# Check if chunks were created
psql -d healthcare_local -U healthadmin -c "
  SELECT chatbot_id, COUNT(*) as chunk_count 
  FROM training_chunks 
  GROUP BY chatbot_id 
  ORDER BY chatbot_id;
"
```

**Expected Results:**
- training_url field should contain your URL
- rtserver logs should show "✓ Successfully synced data to AI Brain"
- New chunks should appear in training_chunks table

### Step 5: Test File Upload (PDF/DOC)

1. Click on **"Files"** tab (or navigate to `/knowledge-hub/files`)
2. Click **"Add File"** button
3. Upload a test PDF file (e.g., sample healthcare brochure)
4. Click **"Upload"** or **"Save"**

**What to Check:**
- ✅ Upload progress shows
- ✅ Success message appears
- ✅ File shows in list

**Backend Verification:**
```bash
# Check automations table for PDF
psql -d healthcare_local -U healthadmin -c "
  SELECT id, training_pdf 
  FROM automations 
  WHERE training_pdf != '[]'::jsonb 
  ORDER BY id DESC 
  LIMIT 1;
"

# Check chunks created
psql -d healthcare_local -U healthadmin -c "
  SELECT chatbot_id, COUNT(*), MAX(created_at) as latest_chunk
  FROM training_chunks 
  GROUP BY chatbot_id;
"
```

---

## Phase 5: SDK Integration Testing

### Step 6: Get Your Chatbot ID

```bash
# Find your chatbot ID
psql -d healthcare_local -U healthadmin -c "
  SELECT c.id, c.chatbot_id, c.chatbot_config->>'chatbot_name' as name, 
         o.organization_name 
  FROM chatbots c 
  JOIN organizations o ON c.organization_id = o.id;
"
```

Note your `chatbot_id` (e.g., "TEST01" or a UUID).

### Step 7: Create Test HTML Page

Create a test file: `test-chatbot.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Chatbot</title>
</head>
<body>
    <h1>Test RAG Chatbot</h1>
    <p>Click the chat button in the bottom right to test the chatbot.</p>

    <!-- Include the SDK -->
    <script src="http://localhost:4000/path-to-sdk/rhinonbot.js"></script>
    
    <!-- Initialize the chatbot -->
    <script>
        window.RhinonChat.init({
            app_id: 'YOUR_CHATBOT_ID', // Replace with your actual chatbot_id
            admin: false,
            position: 'bottom-right'
        });
    </script>
</body>
</html>
```

**OR use the built SDK directly:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Chatbot</title>
</head>
<body>
    <h1>Test RAG Chatbot</h1>
    <p>Click the chat button in the bottom right.</p>

    <!-- Link to locally built SDK -->
    <script src="../rhinonbot-sdk/dist/rhinonbot.js"></script>
    
    <script>
        // Initialize with your chatbot ID
        window.RhinonChat.init({
            app_id: 'TEST01', // Your chatbot ID
            admin: false,
            apiUrl: 'http://localhost:3000',
            aiApiUrl: 'http://localhost:5002'
        });
    </script>
</body>
</html>
```

### Step 8: Open Test Page

```bash
# Serve the test file
cd /path/to/test-file
python3 -m http.server 8000
```

Navigate to: `http://localhost:8000/test-chatbot.html`

### Step 9: Test Chat Functionality

**Test Case 1: Initial Message**
1. Click the chat button (bottom right)
2. Chat widget should open
3. Enter your email (if pre-chat form is enabled)
4. Send message: "What healthcare services do you offer?"

**What to Check:**
- ✅ Chat widget opens
- ✅ Message sends
- ✅ Response starts streaming (word by word)
- ✅ Response contains information from uploaded content
- ✅ No errors in browser console

**Test Case 2: Follow-up Question**
1. Send follow-up: "Tell me more about preventive care"

**What to Check:**
- ✅ Response uses context from previous conversation
- ✅ Response still relevant to uploaded content
- ✅ Streaming continues to work

**Test Case 3: Unrelated Question**
1. Send: "What's the weather today?"

**What to Check:**
- ✅ Bot says "I don't know" or stays on topic
- ✅ Doesn't make up information

### Step 10: Verify Backend Persistence

```bash
# Check if conversation was saved
psql -d healthcare_local -U healthadmin -c "
  SELECT conversation_id, user_id, title, 
         jsonb_array_length(history) as message_count,
         created_at
  FROM bot_conversations
  WHERE chatbot_id = 'TEST01'
  ORDER BY created_at DESC
  LIMIT 5;
"

# View actual messages
psql -d healthcare_local -U healthadmin -c "
  SELECT conversation_id,
         jsonb_array_elements(history) as message
  FROM bot_conversations
  WHERE chatbot_id = 'TEST01'
  ORDER BY created_at DESC
  LIMIT 1;
"
```

**Expected:**
- New conversation_id created
- history JSONB contains user and bot messages
- message_count matches number of exchanges (user + bot = 2 per turn)

---

## Phase 6: End-to-End Testing

### Test Workflow 1: Website → Chat

**Goal:** Verify uploaded website content is used in chat

1. **Upload Website:**
   - URL: `https://en.wikipedia.org/wiki/Primary_care`
   - Wait for success message
   - Verify chunks created in DB

2. **Wait for Processing:**
   ```bash
   # Check if ingestion complete
   docker logs backendai --tail 20 | grep "Vector DB"
   ```

3. **Test Chat:**
   - Open chatbot widget
   - Ask: "What is primary care?"
   - **Expected:** Response should mention primary care details from Wikipedia

4. **Verify Relevance:**
   - Response should NOT contain info from other pages
   - Should use context from the specific page uploaded

### Test Workflow 2: PDF → Chat

**Goal:** Verify PDF content extraction and usage

1. **Upload PDF:**
   - Upload: Sample healthcare brochure PDF
   - Wait for success

2. **Test Chat:**
   - Ask about specific content from the PDF
   - **Expected:** Bot should answer using PDF content

### Test Workflow 3: Multiple Sources

**Goal:** Verify bot can synthesize multiple sources

1. **Upload Multiple Sources:**
   - Website A: General healthcare info
   - Website B: Specific service details
   - PDF: Patient guide

2. **Test Chat:**
   - Ask questions that require info from different sources
   - **Expected:** Bot synthesizes information correctly

### Test Workflow 4: Multi-User Testing

1. **Open widget in incognito/private window**
2. **Different user emails**
3. **Verify:**
   - Each gets separate conversation_id
   - History not mixed between users
   - All conversations saved correctly

---

## Performance Testing

### Test 1: Large Content

1. Upload very large PDF (20+ pages)
2. Check:
   - How many chunks created?
   - Ingestion time?
   - Response quality?

```bash
# Check chunk distribution
psql -d healthcare_local -U healthadmin -c "
  SELECT chatbot_id, 
         COUNT(*) as total_chunks,
         AVG(LENGTH(content)) as avg_chunk_size,
         MAX(LENGTH(content)) as max_chunk_size
  FROM training_chunks
  GROUP BY chatbot_id;
"
```

### Test 2: Response Time

1. Send multiple test messages
2. Measure:
   - Time to first token (should be < 3s)
   - Total response time
   - Vector search time (check logs)

```bash
# Check backend timing logs
docker logs backendai --tail 100 | grep "DEBUG:"
```

### Test 3: Concurrent Users

1. Open 3-5 browser windows
2. Send messages simultaneously
3. Check:
   - All responses complete
   - No errors
   - Database handles load

---

## Troubleshooting Guide

### Issue: "No knowledge base available"

**Cause:** No chunks in database or chatbot_id mismatch

**Fix:**
```bash
# Check if chunks exist
psql -d healthcare_local -U healthadmin -c "
  SELECT chatbot_id, COUNT(*) 
  FROM training_chunks 
  GROUP BY chatbot_id;
"

# If none, trigger ingestion
curl -X POST http://localhost:5002/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"chatbot_id": "YOUR_CHATBOT_ID"}'
```

### Issue: Chat widget not loading

**Cause:** SDK path incorrect or CORS issues

**Fix:**
1. Check browser console for errors
2. Verify SDK path in HTML
3. Ensure apiUrl and aiApiUrl are correct

### Issue: Responses not streaming

**Cause:** Streaming not working or backend error

**Fix:**
```bash
# Check backendai logs
docker logs backendai --tail 50

# Check network tab in browser dev tools
# Look for /standard/chat request
# Should show status "200" and transfer "chunked"
```

### Issue: AI sync not triggering

**Cause:** AI sync code commented or endpoint unreachable

**Fix:**
```bash
# Check rtserver logs
docker logs rtserver --tail 50 | grep "AI"

# Manually trigger ingestion
curl -X POST http://localhost:5002/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"chatbot_id": "YOUR_CHATBOT_ID"}'
```

---

## Success Checklist

### Phase 4: Frontend ✅
- [ ] Rhinon dashboard loads at localhost:4000
- [ ] Can navigate to knowledge hub
- [ ] Website upload works
- [ ] File upload works
- [ ] Success messages appear
- [ ] automations table updates
- [ ] AI sync triggers automatically
- [ ] Chunks appear in training_chunks

### Phase 5: SDK ✅
- [ ] Chatbot widget loads
- [ ] Can open chat interface
- [ ] Unified chat screen shows (no separate history)
- [ ] Can send messages
- [ ] Responses stream word-by-word
- [ ] Responses use uploaded knowledge
- [ ] Follow-up questions work
- [ ] Conversation persists in database

### Phase 6: End-to-End ✅
- [ ] Upload → Chat workflow complete
- [ ] Multiple sources work together
- [ ] Multi-user isolation works
- [ ] Performance acceptable (<5s response)
- [ ] No errors in any component
- [ ] All data persisting correctly

---

## Next Steps After Testing

1. **If all tests pass:**
   - Document any issues found
   - Prepare for AWS deployment
   - Setup production environment

2. **If issues found:**
   - Note specific failing tests
   - Check error logs
   - Review implementation
   - Fix and retest

3. **Production Prep:**
   - Security audit
   - Performance optimization
   - Monitoring setup
   - Backup strategy
   - Load testing

---

## Quick Reference Commands

```bash
# Start all services
docker-compose up -d
cd rhinon && npm run dev  # Terminal 1
# SDK already built

# Check health
curl http://localhost:3000/health && curl http://localhost:5002/health

# View logs
docker logs rtserver -f    # Terminal 2
docker logs backendai -f   # Terminal 3

# Database queries
psql -d healthcare_local -U healthadmin

# Common checks
SELECT * FROM chatbots;
SELECT * FROM automations;
SELECT chatbot_id, COUNT(*) FROM training_chunks GROUP BY chatbot_id;
SELECT * FROM bot_conversations ORDER BY created_at DESC LIMIT 5;
```

---

**Ready to test! Start with Phase 4, then Phase 5, then Phase 6. Good luck! 🚀**
