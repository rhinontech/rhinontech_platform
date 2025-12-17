import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface AnalyticsFilters {
  device?: string;
  location?: string;
  source?: string;
  date?: string;
  chatbot_id: string;
}

export const fetchAnalytics = async ({
  device = "all",
  location = "all",
  source = "all",
  date = "30d",
  chatbot_id,
}: AnalyticsFilters) => {
  try {
    const response = await PrivateAxios.get("/seo/analytics", {
      params: {
        chatbot_id,
        device,
        location,
        source,
        date,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const fetchCompliance = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get(`/seo/complaints`, {
      params: { chatbot_id },
    });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const triggerCompliance = async (chatbot_id:string) => {
  try {
    const response = await PrivateAxios.post(`/seo/trigger-complaint`,{chatbot_id});
    return response.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const fetchPerformance = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get(`/seo/performance`, {
      params: { chatbot_id },
    });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const triggerPerformance = async (chatbot_id:string) => {
  try {
    const response = await PrivateAxios.post(`/seo/trigger-performance`,{chatbot_id});
    return response.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};
