import { PrivateAxios } from "@/helpers/PrivateAxios";

export const getConversations = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get("/conversations", {
      params: { chatbot_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get all conversations", error);
    throw error;
  }
};

// Generic update helper
export const updateConversation = async (
  id: number,
  updates: {
    is_pinned?: boolean;
    assigned_user_id?: number;
  }
) => {
  try {
    const response = await PrivateAxios.patch(
      `/conversations/update-chats/${id}`,
      updates
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update conversation", error);
    throw error;
  }
};

export const deleteConversation = async (id: number) => {
  try {
    const response = await PrivateAxios.delete(
      `/conversations/delete-chats/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete conversation", error);
    throw error;
  }
};

export const getConversationsById = async (
  chatId: string,
  chatbot_id: string
) => {
  try {
    const response = await PrivateAxios.get(`/conversations/chatbot`, {
      params: { chatId, chatbot_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get all conversations", error);
    throw error;
  }
};

export const getConversationsByUserId = async (
  chatbot_id: string,
  chatbot_history: string,
  user_id: string
) => {
  try {
    const response = await PrivateAxios.get(`/conversations/socket`, {
      params: { chatbot_id, chatbot_history, user_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get all conversations", error);
    throw error;
  }
};

export const markConversationAsSeen = async (conversation_id: number) => {
  try {
    const response = await PrivateAxios.post(
      `/conversations/notification/${conversation_id}`
    );

    if (!response) {
      throw new Error("Failed to mark conversation as seen");
    }

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getWhatsAppConfigStatus = async (app_id: string) => {
  try {
    const response = await PrivateAxios.get(
      `/chatbot/whatsapp-config?app_id=${app_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to get WhatsApp config status", error);
    throw error;
  }
};
