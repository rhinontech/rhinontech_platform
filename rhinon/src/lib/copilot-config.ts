// lib/copilot-config.ts
export interface CopilotContextData {
  past_emails?: Array<{
    subject: string;
    from: string;
    content: string;
  }>;
  past_chats?: Array<{
    role: string;
    message: string;
  }>;
  ticket_info?: {
    id: string;
    subject: string;
    status: string;
    priority: string;
  };
}

export interface CopilotMessage {
  role: "ai" | "user";
  text: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

export interface CopilotApiResponse {
  status: string;
  session_id: string;
  response?: string;
  error?: string;
}

export interface CopilotStreamData {
  session_id?: string;
  content?: string;
  done?: boolean;
  error?: string;
}

export class CopilotAPI {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:8000") {
    this.baseUrl = baseUrl;
  }

  async createSession(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/copilot/session/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.session_id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  async clearSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/copilot/session/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.cleared;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/copilot/session/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Error getting session history:', error);
      return [];
    }
  }

  async chatStream(
    prompt: string, 
    sessionId?: string, 
    contextData?: CopilotContextData,
    signal?: AbortSignal
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        session_id: sessionId,
        prompt: prompt,
        context_data: contextData
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async draftEmail(
    prompt: string,
    sessionId?: string,
    contextData?: CopilotContextData
  ): Promise<CopilotApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/copilot/email/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: prompt,
          context_data: contextData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error drafting email:', error);
      throw error;
    }
  }

  async getSuggestions(
    prompt: string,
    sessionId?: string,
    contextData?: CopilotContextData
  ): Promise<CopilotApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/copilot/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: prompt,
          context_data: contextData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }
}

// Environment configuration
export const getCopilotConfig = () => {
  return {
    apiUrl: process.env.NEXT_PUBLIC_COPILOT_API_URL || 'http://localhost:8000',
    isDevelopment: process.env.NODE_ENV === 'development',
    enableDebug: process.env.NEXT_PUBLIC_COPILOT_DEBUG === 'true'
  };
};

// Sample context data for different scenarios
export const getSampleContextData = (scenario: 'support' | 'sales' | 'general' = 'general'): CopilotContextData => {
  switch (scenario) {
    case 'support':
      return {
        past_emails: [
          {
            subject: "Login Issues - Need Help",
            from: "customer@example.com",
            content: "I've been trying to log into my account for the past hour but keep getting error messages."
          }
        ],
        ticket_info: {
          id: "SUPPORT-001",
          subject: "Account Access Problem",
          status: "open",
          priority: "high"
        }
      };
    
    case 'sales':
      return {
        past_emails: [
          {
            subject: "Pricing Inquiry",
            from: "prospect@company.com",
            content: "Hi, I'm interested in your enterprise plan. Can you provide custom pricing for 500+ users?"
          }
        ],
        past_chats: [
          {
            role: "user",
            message: "What features are included in the enterprise package?"
          }
        ],
        ticket_info: {
          id: "SALES-123",
          subject: "Enterprise Package Inquiry",
          status: "in_progress",
          priority: "medium"
        }
      };
    
    default:
      return {
        past_emails: [
          {
            subject: "General Inquiry",
            from: "user@example.com",
            content: "I have some questions about your service."
          }
        ]
      };
  }
};