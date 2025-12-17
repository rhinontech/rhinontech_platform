import axios from 'axios';
// import apiStore from "../../Utils/apiStore";

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;
// console.log('Server API URL:', process.env.REACT_APP_SERVER_API_URL);

export const getSocketConversationsByUserId = async (
  user_id: string,
  chatbot_id: string,
  chatbot_history: string,
) => {
  try {
    const response = await axios.get(
      `${serverUrl}/conversations/socketConversation`,
      {
        params: { user_id, chatbot_id, chatbot_history },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get all conversations', error);
    throw error;
  }
};

export const closeSocketConversation = async (conversation_id: string) => {
  try {
    const response = await axios.post(
      `${serverUrl}/conversations/socketConversation/close`,
      {
        conversation_id,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to close conversation', error);
    throw error;
  }
};

export const submitPostChatForm = async (
  conversation_id: string,
  review_data: any,
) => {
  try {
    const response = await axios.post(
      `${serverUrl}/conversations/submit-review`,
      {
        conversation_id,
        review_data,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to close conversation', error);
    throw error;
  }
};
