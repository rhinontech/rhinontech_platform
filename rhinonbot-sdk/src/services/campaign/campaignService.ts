// Campaign service
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { Campaign } from '@/types';

/**
 * Get campaigns for a chatbot
 */
export const getCampaignsChatbot = async (chatbotId: string): Promise<Campaign[]> => {
  const response = await serverApi.get(ENDPOINTS.CAMPAIGNS_CHATBOT, {
    params: { chatbot_id: chatbotId },
  });
  return response.data;
};
