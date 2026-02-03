import { PrivateAxios } from "@/helpers/PrivateAxios";
import axios from "axios";

export interface TrainingUrl {
  url: string;
  sitemap?: boolean;
  updatedAt: string;
  is_trained?: boolean;
}

export interface TrainingPdf {
  size: number;
  s3Name: string;
  uploadedAt: string;
  originalName: string;
  is_trained?: boolean;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  is_trained?: boolean;
}

export const createOrUpdateAutomation = async (data: {
  training_url?: TrainingUrl[];
  training_pdf?: TrainingPdf[];
  training_article?: Article[];
  isChatbotTrained: boolean;
}) => {
  try {
    const response = await PrivateAxios.post(
      "/automations/update-automation",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create or update automation", error);
    throw error;
  }
};

export const getAutomation = async () => {
  try {
    const response = await PrivateAxios.get("/automations");

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const getArticleForAutomation = async () => {
  try {
    const response = await PrivateAxios.get("/automations/get-article");

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const analyseUrl = async (url: string) => {
  try {
    const response = await PrivateAxios.post("/automations/analyze-url", {
      url,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

const aiApi = process.env.NEXT_PUBLIC_API_AI_URL;

export const trainAndSetAssistant = async (chatbot_id: string) => {
  try {
    const response = await axios.post(`${aiApi}/api/set_assistant`, {
      chatbot_id,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to train and set chatbot assistand", error);
    throw error;
  }
};

/**
 * Trigger training via rtserver
 * rtserver proxies to backendai with webhook for progress updates
 */
export const triggerTraining = async (chatbot_id: string) => {
  try {
    // Call rtserver which proxies to backendai
    const response = await PrivateAxios.post("/automations/trigger-training");
    return response.data;
  } catch (error) {
    console.error("Failed to trigger training", error);
    throw error;
  }
};

export const deleteTrainingSource = async (source: string, type: 'url' | 'file' | 'article') => {
  try {
    const response = await PrivateAxios.post("/automations/delete-source", {
      source,
      type
    });
    return response.data;
  } catch (error) {
    console.error("Failed to delete training source", error);
    throw error;
  }
};
