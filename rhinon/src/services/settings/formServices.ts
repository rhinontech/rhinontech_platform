import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface TicketFormConfig {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string; // fixed typo
}

export interface PreChatFormConfig {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string; // fixed typo
}

export interface PostChatFormConfig {
  enabled: boolean;
  elements: any[];
}

// Get forms configuration for a chatbot
export const getForms = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get(`/forms`, {
      params: { chatbot_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch forms configuration", error);
    throw error;
  }
};

// Update or create forms configuration
export const updateForms = async (
  chatbot_id: string,
  data: {
    ticket_form?: TicketFormConfig[];
    pre_chat_form?: PreChatFormConfig[];
    post_chat_form?: PostChatFormConfig;
  }
) => {
  try {
    const response = await PrivateAxios.post(
      `/forms/update-forms`,
      data,
      { params: { chatbot_id } } //  pass chatbot_id in query
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update forms configuration", error);
    throw error;
  }
};
