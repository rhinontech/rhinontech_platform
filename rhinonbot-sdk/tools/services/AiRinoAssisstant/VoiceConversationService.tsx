import axios from "axios";

const AI_API_URL = process.env.REACT_APP_API_URL_AI;

export const getVoiceSessionToken = async (chatbot_id: string) => {
  try {
    const response = await axios.post(`${AI_API_URL}/voice_session`, {
      chatbot_id: chatbot_id,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to start voice session", error);
    throw error;
  }
};
