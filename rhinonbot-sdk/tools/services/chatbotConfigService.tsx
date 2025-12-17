import axios from 'axios';

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;

export const getChatbotConfig = async (chatbot_id: string) => {
  try {
    // 1Fetch chatbot config
    const response = await axios.get(`${serverUrl}/chatbot/chatbot`, {
      params: { chatbot_id },
    });

    const config = response.data;

    // If chatbot not installed, call set-installed route
    if (!config.chatbot_installed) {
      try {
        await axios.post(`${serverUrl}/chatbot/set-installed`, null, {
          params: { chatbot_id },
        });

        // Optimistically mark as installed in local response
        config.chatbot_installed = true;
      } catch (err) {
        console.error('Failed to set chatbot installed:', err);
      }
    }

    return config;
  } catch (error) {
    console.error('Failed to get chatbot config', error);
    throw error;
  }
};

export const getWhatsAppConfig = async (app_id: string) => {
  try {
    const response = await axios.get(`${serverUrl}/chatbot/whatsapp-config`, {
      params: { app_id },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get whatsapp config', error);
    // Return null or throw depending on how we want to handle it.
    // Returning null for now to just fail gracefully
    return null;
  }
};


// for whatsapp
export const checkCustomerPhone = async (email: string) => {
  try {
    const response = await axios.get(`${serverUrl}/chatbot/customer-phone`, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to check customer phone', error);
    return null;
  }
};

export const saveCustomerPhone = async (email: string, phoneNumber: string) => {
  try {
    const response = await axios.post(`${serverUrl}/chatbot/customer-phone`, {
      email,
      phoneNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to save customer phone', error);
    throw error;
  }
};
