# Returning User Detection - Implementation Plan

## Goal

Implement customer recognition in the voice chatbot so returning users are greeted by name and don't need to re-enter their information, while new users go through the normal form collection process.

## User Review Required

> [!IMPORTANT]
> **Email Requirement**: This implementation requires users to provide their email address when starting a voice session. Without an email, users will be treated as new/guest users.

> [!NOTE]
> **Customer Scope**: Customer lookup is scoped by organization. The same email across different organizations will be treated as separate customers.

## Proposed Changes

### Backend Implementation

#### [NEW] [postgresDB.py](file:///Users/apple/Desktop/Personal/Rhinon%20Tech/Rhinon%20Tech%20New/rhinontech_platform/backendai/DB/postgresDB.py)

Add a new function to lookup customers by email:

```python
def get_customer_by_email(chatbot_id: str, email: str):
    """
    Looks up a customer by email for a given chatbot's organization.
    Returns: dict with {name, phone, email} or None if not found
    """
    with get_db_connection() as conn:
        # Get organization_id from chatbot
        org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
        org_result = run_query(conn, org_query, (chatbot_id,))
        
        if not org_result or not org_result[0]:
            return None
        
        org_id = org_result[0][0]
        
        # Lookup customer
        customer_query = """
            SELECT email, custom_data 
            FROM customers 
            WHERE organization_id = %s AND email = %s
        """
        customer_result = run_query(conn, customer_query, (org_id, email))
        
        if customer_result and customer_result[0]:
            email_val, custom_data = customer_result[0]
            return {
                "email": email_val,
                "name": custom_data.get("name", ""),
                "phone": custom_data.get("phone", "")
            }
        
        return None
```

---

#### [MODIFY] [realtime_rag_routes.py](file:///Users/apple/Desktop/Personal/Rhinon%20Tech/Rhinon%20Tech%20New/rhinontech_platform/backendai/routes/realtime_rag_routes.py)

**After Line 97** (after `final_instructions = f"{system_instruction}{history_text}"`):

Add customer lookup and conditional instruction building:

```python
# D.1 Check for Returning Customer
customer_data = None
is_returning_user = False

if user_email and user_email != "guest@example.com":
    from DB.postgresDB import get_customer_by_email
    customer_data = get_customer_by_email(chatbot_id, user_email)
    is_returning_user = customer_data is not None
    
    if is_returning_user:
        customer_name = customer_data.get("name", "")
        print(f"✅ RETURNING USER: {customer_name} ({user_email})")
        logging.info(f"✅ RETURNING USER: {customer_name} ({user_email})")
```

**Replace Lines 99-157** (form collection logic):

Update to be conditional based on user status:

```python
# D.2 Build Instructions Based on User Status
if is_returning_user:
    # Returning customer - personalized greeting, no form collection
    customer_name = customer_data.get("name", "")
    final_instructions += (
        f"\n\n[RETURNING CUSTOMER]\n"
        f"The user is {customer_name}, a valued returning customer.\n"
        f"Greet them warmly by name at the start of the conversation.\n"
        f"You already have their contact information, so do NOT ask for their name, email, or phone.\n"
        f"Focus on providing excellent service and answering their questions."
    )
    # No tools needed for returning users
    tools = []
else:
    # New customer - collect information
    from DB.postgresDB import get_pre_chat_form
    form_config = get_pre_chat_form(chatbot_id)
    tools = []
    
    print(f"🔍 DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
    logging.info(f"🔍 DEBUG: chatbot_id={chatbot_id}, form_config={form_config}")
    
    if form_config:
        # Generate Tool Definition from Form Config
        properties = {}
        required_fields = []
        
        for field in form_config:
            field_id = field.get("id", "unknown")
            field_type = "string"
            if field.get("type") == "number": 
                field_type = "number"
            
            properties[field_id] = {
                "type": field_type,
                "description": field.get("label", field_id)
            }
            if field.get("required"):
                required_fields.append(field_id)
        
        print(f"🔍 DEBUG: properties={properties}, required_fields={required_fields}")
        logging.info(f"🔍 DEBUG: properties={properties}, required_fields={required_fields}")
        
        if properties:
            tools = [{
                "type": "function",
                "name": "submit_pre_chat_form",
                "description": "Submit user form data when they provide it.",
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required_fields
                }
            }]
            
            print(f"✅ DEBUG: Tools generated: {len(tools)} tool(s)")
            logging.info(f"✅ DEBUG: Tools generated: {len(tools)} tool(s)")
            
            # Append form collection instructions
            final_instructions += (
                f"\n\n[CONVERSATION GUIDELINES]\n"
                f"Engage naturally with the user. Take your time to respond thoughtfully.\n"
                f"After 4-6 conversation turns, collect Name, Email, and Phone Number.\n"
                f"Ask for ONE detail at a time. Wait for their response before asking the next.\n"
                f"Once you have all three, call 'submit_pre_chat_form' tool.\n"
                f"After calling the tool, acknowledge briefly and continue the conversation."
            )
    else:
        print(f"⚠️ DEBUG: No form_config found for chatbot_id={chatbot_id}")
        logging.warning(f"⚠️ DEBUG: No form_config found for chatbot_id={chatbot_id}")
```

**Update Lines 174-176** (tools configuration):

Change to use the conditionally-built tools:

```python
if tools:
    payload["tools"] = tools
    payload["tool_choice"] = "auto"
```

---

#### [MODIFY] [voice_service.py](file:///Users/apple/Desktop/Personal/Rhinon%20Tech/Rhinon%20Tech%20New/rhinontech_platform/backendai/services/voice_service.py)

**Note**: This file uses a different flow (assistant-based). If you want consistent behavior, apply similar logic:

**After Line 42** (after instructions are combined):

```python
# Check for returning customer
customer_data = None
is_returning_user = False

# Note: This function doesn't receive user_email in current implementation
# You may need to add it to the function signature if you want customer recognition here
# For now, this service may continue with the standard flow
```

> [!WARNING]
> **voice_service.py** uses a different session creation flow (assistant-based). If this endpoint is actively used, you'll need to update its signature to accept `user_email` and apply similar customer lookup logic.

---

### Frontend Implementation

#### [MODIFY] [index.ts](file:///Users/apple/Desktop/Personal/Rhinon%20Tech/Rhinon%20Tech%20New/rhinontech_platform/rhinonbot-sdk/src/services/voice/index.ts)

**Update function signature (Line 31)**:

```typescript
export const getVoiceSessionToken = async (
  chatbot_id: string,
  user_email?: string
): Promise<VoiceSessionResponse> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/realtime/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        chatbot_id,
        user_email: user_email || undefined
      }),
    });
    // ... rest of the code
  }
}
```

---

#### [MODIFY] [Voice.tsx](file:///Users/apple/Desktop/Personal/Rhinon%20Tech/Rhinon%20Tech%20New/rhinontech_platform/rhinonbot-sdk/src/screens/VoiceScreen/Voice.tsx)

**Update Line 160** (in `initRealTimeSession` function):

```typescript
// Get user email from props, URL params, or localStorage
const userEmail = getUserEmail(); // Implement this helper function

const { client_secret } = await getVoiceSessionToken(appId, userEmail);
```

**Add helper function** (before the Voice component):

```typescript
// Helper to get user email from various sources
const getUserEmail = (): string | undefined => {
  // Option 1: From URL params
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  if (emailFromUrl) return emailFromUrl;
  
  // Option 2: From localStorage (if user logged in)
  const emailFromStorage = localStorage.getItem('user_email');
  if (emailFromStorage) return emailFromStorage;
  
  // Option 3: From cookies (if available)
  // const emailFromCookie = getCookie('user_email');
  // if (emailFromCookie) return emailFromCookie;
  
  return undefined;
};
```

## Verification Plan

### Manual Testing

#### Test Case 1: New User Flow
1. Open voice chatbot without email
2. **Expected**: Bot asks for Name, Email, Phone after 4-6 turns
3. Provide details
4. **Expected**: Data saved to customers table
5. Check database: `SELECT * FROM customers WHERE email = 'test@example.com'`

#### Test Case 2: Returning User Flow
1. Open voice chatbot with email from Test Case 1
2. **Expected**: Bot greets user by name immediately
3. **Expected**: Bot does NOT ask for contact details
4. Have conversation
5. **Expected**: No form collection occurs

#### Test Case 3: Guest User
1. Open voice chatbot without email parameter
2. **Expected**: Treated as new user
3. **Expected**: Form collection happens normally

### Database Verification

```sql
-- Check if customer exists
SELECT 
  email, 
  custom_data->>'name' as name,
  custom_data->>'phone' as phone,
  created_at
FROM customers 
WHERE email = 'test@example.com';

-- Check customer count by organization
SELECT 
  o.name as organization_name,
  COUNT(c.id) as customer_count
FROM customers c
JOIN organizations o ON c.organization_id = o.id
GROUP BY o.name;
```

### Backend Logs to Monitor

```
✅ RETURNING USER: John Doe (john@example.com)
🔍 DEBUG: chatbot_id=xxx, form_config=[...]
✅ DEBUG: Tools generated: 1 tool(s)
```

## Implementation Checklist

- [ ] Add `get_customer_by_email` function to `postgresDB.py`
- [ ] Update `realtime_rag_routes.py` with customer lookup logic
- [ ] Update `voice_service.py` (if needed)
- [ ] Update frontend `index.ts` to accept email parameter
- [ ] Update `Voice.tsx` to pass email to session
- [ ] Implement `getUserEmail` helper function
- [ ] Test new user flow
- [ ] Test returning user flow
- [ ] Test guest user flow
- [ ] Verify database entries
- [ ] Check backend logs for proper detection

## Rollout Strategy

### Phase 1: Backend Only (Safe Deployment)
1. Deploy backend changes
2. Without frontend changes, all users treated as new (current behavior)
3. No breaking changes

### Phase 2: Frontend Integration
1. Deploy frontend changes
2. Users with email in URL/storage will be recognized
3. Guest users continue normal flow

### Phase 3: Monitoring
1. Monitor customer recognition rate
2. Check for false positives/negatives
3. Gather user feedback
