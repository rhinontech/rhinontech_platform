import { PrivateAxios } from "@/helpers/PrivateAxios";

// Types
export interface CampaignButton {
    id: string;
    text: string;
    url: string;
    style: "primary" | "secondary" | "danger";
    actionType?: "open-url" | "send-message" | "phone-call" | "open-moment" | "dismiss" | "copy-coupon";
}

export interface CampaignMedia {
    type: "image" | "video" | "emoji";
    src: string;
    alt?: string;
}

export interface CampaignContent {
    templateId: string;
    layout: string;
    heading: string;
    subheading: string;
    hasImage: boolean;
    media: CampaignMedia | null;
    buttons: CampaignButton[];
}

export interface CampaignCondition {
    field: string;
    operator: string;
    value: string;
}

export interface CampaignTargeting {
    visitorType: "all" | "first-time" | "returning";
    trigger: {
        type: "time-on-page";
        value: number;
        unit: "seconds" | "minutes";
    };
    rules: {
        matchType: "match-all" | "match-any";
        conditions: CampaignCondition[];
    };
}

export interface ChatbotCampaign {
    id?: string;
    name?: string;
    type: "recurring" | "one-time";
    status: "active" | "draft" | "paused";
    content: CampaignContent;
    targeting: CampaignTargeting;
    createdAt?: string;
    updatedAt?: string;
}

// API Service Functions
export const chatbotCampaignsService = {
    // Get all recurring campaigns
    getRecurringCampaigns: async (): Promise<ChatbotCampaign[]> => {
        const response = await PrivateAxios.get("/campaigns/chatbot/type/recurring");
        return response.data;
    },

    // Get all one-time campaigns
    getOneTimeCampaigns: async (): Promise<ChatbotCampaign[]> => {
        const response = await PrivateAxios.get("/campaigns/chatbot/type/one-time");
        return response.data;
    },

    // Get campaign by ID
    getCampaignById: async (id: string): Promise<ChatbotCampaign> => {
        const response = await PrivateAxios.get(`/campaigns/chatbot/${id}`);
        return response.data;
    },

    // Create new campaign
    createCampaign: async (campaign: ChatbotCampaign): Promise<ChatbotCampaign> => {
        const response = await PrivateAxios.post("/campaigns/chatbot/", campaign);
        return response.data;
    },

    // Update campaign
    updateCampaign: async (id: string, campaign: ChatbotCampaign): Promise<ChatbotCampaign> => {
        const response = await PrivateAxios.put(`/campaigns/chatbot/${id}`, campaign);
        return response.data;
    },

    // Delete campaign
    deleteCampaign: async (id: string): Promise<void> => {
        await PrivateAxios.delete(`/campaigns/chatbot/${id}`);
    },

    // Update campaign status only
    updateCampaignStatus: async (id: string, status: "active" | "draft" | "paused"): Promise<ChatbotCampaign> => {
        const response = await PrivateAxios.patch(`/campaigns/chatbot/${id}/status`, { status });
        return response.data;
    },
};
