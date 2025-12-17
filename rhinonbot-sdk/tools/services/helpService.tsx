import axios from 'axios';

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;

export const fetchFoldersWithArticles = async (chatbot_id: string) => {
  try {
    const response = await axios.get(`${serverUrl}/folders/chatbot-structure`, {
      params: { chatbot_id },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics data', error);
    throw error;
  }
};

export const getArticle = async (articleId: string) => {
  try {
    const response = await axios.get(`${serverUrl}/articles/${articleId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics data', error);
    throw error;
  }
};
