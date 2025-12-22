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
// Request types
export interface RealtimeLeadRequest {
  chatbot_id: string;
  email: string;
  name?: string;
  phone?: string;
}

/**
 * Get a voice session token for real-time voice communication
 */
export const getVoiceSessionToken = async (chatbot_id: string): Promise<VoiceSessionResponse> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/realtime/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatbot_id }), // Backend will handle default user/guest
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

/**
 * Submit lead details collected via Voice
 */
export const submitVoiceLead = async (data: RealtimeLeadRequest): Promise<any> => {
  try {
    const response = await fetch(`${getAiApiUrl()}/realtime/submit_lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to submit voice lead', error);
    // Don't throw, just log. The voice session shouldn't crash if save fails.
    return { status: 'error', message: 'Failed to save' };
  }
};
