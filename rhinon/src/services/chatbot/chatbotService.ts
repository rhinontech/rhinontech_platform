import { PrivateAxios } from "@/helpers/PrivateAxios";

export const fetchChatbotConfig = async () => {
  try {
    const response = await PrivateAxios.get("/chatbot/chatbots");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chatbots data", error);
    throw error;
  }
};

export const updateChatbotConfig = async (
  chatbot_id: string,
  chatbot_config: any
) => {
  try {
    const response = await PrivateAxios.patch("/chatbot/chatbot-config", {
      chatbot_id: chatbot_id,
      chatbot_config: chatbot_config,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chatbots data", error);
    throw error;
  }
};

export const getApiKey = async () => {
  try {
    const response = await PrivateAxios.get("/chatbot/get-api-key");
    return response.data;
  } catch (error) {
    console.error("Failed to get api key data", error);
    throw error;
  }
};

export const updateApiKey = async (apiKey: string) => {
  try {
    const response = await PrivateAxios.post("/chatbot/update-api-key", {
      apiKey,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to updating api key data", error);
    throw error;
  }
};
