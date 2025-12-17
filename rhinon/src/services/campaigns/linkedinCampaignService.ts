import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface LinkedInCampaignData {
  campaign_name: string;
  campaign_description?: string;
  campaign_type: "post" | "article" | "video" | "carousel" | "poll";
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  target_audience?: any;
  scheduled_time?: string;
  is_sponsored?: boolean;
  budget?: number;
  call_to_action?: string;
  cta_link?: string;
}

export interface LinkedInCampaign extends LinkedInCampaignData {
  id: number;
  organization_id: number;
  user_id: number;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  linkedin_post_id?: string;
  engagement_metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    clicks?: number;
    [x: string]: number | undefined;
  };
  published_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new LinkedIn campaign
 */
export const createLinkedInCampaign = async (data: LinkedInCampaignData) => {
  try {
    const response = await PrivateAxios.post("/linkedin-campaigns", data);
    return response.data;
  } catch (error) {
    console.error("Error creating LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Get all LinkedIn campaigns
 */
export const getAllLinkedInCampaigns = async (params?: {
  status?: string;
  campaign_type?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  try {
    const response = await PrivateAxios.get("/linkedin-campaigns", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching LinkedIn campaigns:", error);
    throw error;
  }
};

/**
 * Get a single LinkedIn campaign by ID
 */
export const getLinkedInCampaignById = async (id: number) => {
  try {
    const response = await PrivateAxios.get(`/linkedin-campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Update a LinkedIn campaign
 */
export const updateLinkedInCampaign = async (
  id: number,
  data: Partial<LinkedInCampaignData>
) => {
  try {
    const response = await PrivateAxios.put(`/linkedin-campaigns/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Delete a LinkedIn campaign
 */
export const deleteLinkedInCampaign = async (id: number) => {
  try {
    const response = await PrivateAxios.delete(`/linkedin-campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Publish a LinkedIn campaign immediately
 */
export const publishLinkedInCampaign = async (id: number) => {
  try {
    const response = await PrivateAxios.post(
      `/linkedin-campaigns/${id}/publish`
    );
    return response.data;
  } catch (error) {
    console.error("Error publishing LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Schedule a LinkedIn campaign
 */
export const scheduleLinkedInCampaign = async (
  id: number,
  scheduled_time: string
) => {
  try {
    const response = await PrivateAxios.post(
      `/linkedin-campaigns/${id}/schedule`,
      { scheduled_time }
    );
    return response.data;
  } catch (error) {
    console.error("Error scheduling LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Bulk create LinkedIn campaigns
 */
export const bulkCreateLinkedInCampaigns = async (campaigns: LinkedInCampaignData[]) => {
  try {
    const response = await PrivateAxios.post("/linkedin-campaigns/bulk", { campaigns });
    return response.data;
  } catch (error) {
    console.error("Error bulk creating LinkedIn campaigns:", error);
    throw error;
  }
};

/**
 * Cancel a scheduled LinkedIn campaign
 */
export const cancelLinkedInCampaign = async (id: number) => {
  try {
    const response = await PrivateAxios.post(
      `/linkedin-campaigns/${id}/cancel`
    );
    return response.data;
  } catch (error) {
    console.error("Error cancelling LinkedIn campaign:", error);
    throw error;
  }
};

/**
 * Update engagement metrics for a campaign
 */
export const updateLinkedInCampaignMetrics = async (
  id: number,
  metrics: any
) => {
  try {
    const response = await PrivateAxios.put(
      `/linkedin-campaigns/${id}/metrics`,
      { engagement_metrics: metrics }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating campaign metrics:", error);
    throw error;
  }
};

/**
 * Get LinkedIn campaign analytics
 */
export const getLinkedInCampaignAnalytics = async (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  try {
    const response = await PrivateAxios.get("/linkedin-campaigns/analytics", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    throw error;
  }
};

/**
 * Duplicate a LinkedIn campaign
 */
export const duplicateLinkedInCampaign = async (id: number) => {
  try {
    const response = await PrivateAxios.post(
      `/linkedin-campaigns/${id}/duplicate`
    );
    return response.data;
  } catch (error) {
    console.error("Error duplicating LinkedIn campaign:", error);
    throw error;
  }
};
