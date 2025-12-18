/**
 * Voice conversation services
 */

import { getAiApiUrl } from '../api';

export interface VoiceClientSecret {
  value: string;
  expires_at?: number;
}

export interface VoiceSessionResponse {
  client_secret: VoiceClientSecret;
  session_id?: string;
}

/**
 * Get a voice session token for real-time voice communication
 */
export const getVoiceSessionToken = async (chatbot_id: string): Promise<VoiceSessionResponse> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/voice_session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatbot_id }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to start voice session', error);
    throw error;
  }
};
