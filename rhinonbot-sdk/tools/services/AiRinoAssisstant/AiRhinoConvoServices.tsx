import axios from 'axios';

// const AI_API_URL = "https://api-ai.rhinontech.com"
// const AI_API_URL = "http://127.0.0.1:5001"

const AI_API_URL = process.env.REACT_APP_API_URL_AI;
console.log(AI_API_URL);
// console.log('Server API URL:', process.env.REACT_APP_API_URL_AI);

export interface StartNewChatRequest {
  user_id: string;
  app_id: string;
  user_plan: string;
}

// Interface for Chat With Assistant
export interface ChatWithAssistantRequest {
  user_id: string;
  user_email: string;
  chatbot_id: string;
  conversation_id: string;
  prompt: string;
  isFreePlan: boolean;
  currentPlan: string;
}

// Interface for Get Chat History
export interface GetChatHistoryRequest {
  user_id: string;
  chatbot_id: string;
  conversation_id: string;
}

export const getSetAssistant = async (app_id: string) => {
  try {
    const response = await axios.post(`${AI_API_URL}/set_user_assistant`, {
      chatbot_id: app_id,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to start a new chat', error);
    throw error;
  }
};

export const chatWithAssistant = async (
  requestBody: ChatWithAssistantRequest,
  onToken: (token: string) => void,
  onComplete?: (data?: any) => void,
  onError?: (error: any) => void,
) => {
  try {
    const response = await fetch(`${AI_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No readable stream');

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');

      for (let i = 0; i < parts.length - 1; i++) {
        const line = parts[i];
        if (!line.startsWith('data:')) continue;

        try {
          const data = JSON.parse(line.slice(5).trim());

          // Stream tokens
          if (data.token) onToken(data.token);

          // Final event
          if (data.event) {
            onComplete?.(data);
          }

          // Error
          if (data.error) onError?.(data.error);
        } catch (err) {
          console.error('Parse SSE chunk error:', err);
        }
      }

      buffer = parts[parts.length - 1];
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError?.(error);
  }
};

export const getChatHistory = async (requestBody: GetChatHistoryRequest) => {
  try {
    const response = await axios.post(
      `${AI_API_URL}/chat_history`,
      requestBody,
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get chat history', error);
    throw error;
  }
};

export const getConversationByUserId = async (
  userId: string,
  appId: string,
) => {
  try {
    const response = await axios.post(`${AI_API_URL}/conversation_by_user_id`, {
      user_id: userId,
      chatbot_id: appId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get conversation by user ID', error);
    throw error;
  }
};
