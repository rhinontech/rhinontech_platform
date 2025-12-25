# Implementation Plan - Standard RAG & Inline Lead Gen

# Goal Description
Upgrade Rhinon Chatbot to Standard RAG (GPT-4o-mini) with **inline lead generation**. Ensure strict adherence to the **9-point** user requirement list, focusing on conversational quality, context awareness, and seamless CRM integration.

## User Review Required
> [!IMPORTANT]
> **Plan Coverage**: This plan explicitly addresses all 9 points of your request.
> 1.  **Standard RAG**: Switching `standard_rag_controller` to GPT.
> 2.  **Inline Form**: Chat starts immediately. Form appears as an inline bubble (not overlay).
> 3.  **Prompt Engineering**: Removed DB fetch. Added "Favor Company" & "Self-Aware" instructions.
> 4.  **Lead Gen**: Hybrid approach. Inline Form (Config) + Conversational Follow-up -> `customers` table -> "Customer Pipeline".
> 5.  **Live Visitor**: Immediate socket update upon lead submission.
> 6.  **Response Quality**: Prompt updated to avoid repetitive "How can I help" and use history effectively.
> 7.  **Copilot Context**: Frontend passes `currentPage` + generic sitemap knowledge injected into Copilot System Prompt.
> 8.  **Company Context**: RAG retrieval is strictly scoped to `app_id`.
> 9.  **Automation Fix**: Trigger URL updated in `automationController`.

## Proposed Changes

### Backend AI (`backendai`)

#### [MODIFY] [standard_rag_controller.py](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/backendai/controller/standard_rag_controller.py)
-   **Remove**: Blocking `get_pre_chat_form` query.
-   **Update System Prompt**:
    -   **Context**: "You are the AI assistant for [Company Name]. Always speak favorably about us."
    -   **Self-Correction**: "Do NOT repeat 'How can I help'. Check history. If user just said 'Hi', greet. If in flow, answer directly."
    -   **Lead Gen**: "Check if User Details are missing. If so, call `request_inline_form`."
-   **Implement**: `request_inline_form` tool.
-   **Implement**: `submit_customer_lead` tool (Calls [rtserver](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/rtserver)).

#### [MODIFY] [copilot_controller.py](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/backendai/controller/copilot_controller.py)
-   **Update System Prompt**: "You are an expert on the Rhinon Platform. You know the purpose of every page."
-   **Update [generate_response](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/backendai/controller/copilot_controller.py#57-82)**: Inject `current_url` and `page_content` from the request into the prompt context.

### RT Server ([rtserver](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/rtserver))

#### [NEW] [crmControllers/aiLeadController.js]
-   **Endpoint**: `POST /api/crm/ai-lead-sync`
-   **Logic**:
    -   Check `customers` (Email + Org).
    -   Update `custom_data` if exists. Create if new.
    -   Ensure entity is in "Customer Pipeline".

#### [MODIFY] [automationController.js](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/rtserver/controllers/automationController.js)
-   **Fix**: Update trigger to `http://.../standard/set_user_assistant`.

### RhinonBot SDK (`rhinonbot-sdk`)

#### [MODIFY] [ChatScreen.tsx](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/rhinonbot-sdk/src/screens/ChatScreen/ChatScreen.tsx)
-   **Remove**: Overlay [PreChatForm](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/rhinonbot-sdk/src/components/Forms/PreChatForm.tsx#12-97).
-   **Init**: Send "User Joined" event hidden message to AI.
-   **Handle**: `request_inline_form` -> Render `InlineFormMessage` bubble.
-   **Update**: On Form Submit -> Emit socket event `update_live_visitor` (Point 5).

#### [MODIFY] [ChatComponents.tsx](file:///Users/varunmathiyalagan/Desktop/Rhinon-Tech/newrepo/work/rhinontech_platform/rhinonbot-sdk/src/screens/ChatScreen/ChatComponents.tsx)
-   **New Component**: `InlineFormMessage`. reads config.

## Verification Plan

### Manual Verification
1.  **Response Quality**: Chat "Hi". Bot should say "Hello!" (not "How can I help?"). Chat "Price?". Bot gives price (not "How can I help?").
2.  **Copilot**: Go to "Invoices". Ask Copilot "How to create?". It should say "Click 'New Invoice' button on top right" (Page Aware).
