import { PrivateAxios } from "@/helpers/PrivateAxios";

export const getAllLiveVisitors = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get(`/traffic/visitors/${chatbot_id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chatbots data", error);
    throw error;
  }
};

export const getVisitorsIpAddressForChats = async (
  chatbot_id: string,
  user_id: string
) => {
  try {
    const response = await PrivateAxios.get("/traffic/chat-ip-address", {
      params: { chatbot_id, user_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch visitors' IP address", error);
    throw error;
  }
};

export const getVisitorsIpAddressForTickets = async (
  chatbot_id: string,
  user_email: string
) => {
  try {
    const response = await PrivateAxios.get("/traffic/ticket-ip-address", {
      params: { chatbot_id, user_email },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch visitors' IP address", error);
    throw error;
  }
};

export const createConversation = async (payload: {
  user_id: string;
  user_email: string;
  chatbot_id: string;
}) => {
  try {
    const response = await PrivateAxios.post(
      "/traffic/create-conversation",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch visitors' IP address", error);
    throw error;
  }
};
