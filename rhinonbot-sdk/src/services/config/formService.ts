// Form services
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { FormField, PostChatFormConfig } from '@/types';

export interface FormsResponse {
  pre_chat_form: FormField[];
  post_chat_form: PostChatFormConfig;
  ticket_form: FormField[];
}

/**
 * Get forms configuration for a chatbot
 */
export const getForms = async (chatbotId: string): Promise<FormsResponse> => {
  const response = await serverApi.get(ENDPOINTS.CHATBOT_FORMS, {
    params: { chatbot_id: chatbotId },
  });
  return response.data;
};

export interface PreChatFormData {
  email: string;
  chatbot_id: string;
  custom_data: Record<string, string>;
}

/**
 * Save pre-chat form custom values
 */
export const savePreChatCustomValue = async (data: PreChatFormData) => {
  const response = await serverApi.post(ENDPOINTS.SAVE_PRECHAT_VALUES, data);
  return response.data;
};
