import axios from 'axios';

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;

export const getCampaignsChatbot = async (chatbot_id: string) => {
    try {
        // 1Fetch chatbot config
        const response = await axios.get(`${serverUrl}/campaigns/chatbot/all`, {
            params: { chatbot_id },
        });

        const campaignsChatbot = response.data;

        console.log(campaignsChatbot);


        return campaignsChatbot;
    } catch (error) {
        console.error('Failed to get campaigns chatbot', error);
        throw error;
    }
};
