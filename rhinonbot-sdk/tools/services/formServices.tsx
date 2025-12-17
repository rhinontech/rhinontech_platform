import axios from 'axios';

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;

export const getForms = async (chatbot_id: string) => {
  try {
    const response = await axios.get(`${serverUrl}/forms/chatbot-forms`, {
      params: { chatbot_id },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch forms configuration', error);
    throw error;
  }
};

export const savePreChatCustomValue = async ({
  email,
  chatbot_id,
  custom_data,
}: {
  email: string;
  chatbot_id: string;
  custom_data: any;
}) => {
  try {
    const response = await axios.post(
      `${serverUrl}/forms/save-prechat-forms-values`,
      {
        chatbot_id,
        email,
        custom_data,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to save pre-chat form values', error);
    throw error;
  }
};
