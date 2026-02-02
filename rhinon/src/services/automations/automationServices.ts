import { PrivateAxios } from "@/helpers/PrivateAxios";
import axios from "axios";

interface TrainingUrl {
  url: string;
  sitemap: boolean;
  updatedAt: string;
  is_trained?: boolean;
}

interface TrainingPdf {
  size: number;
  s3Name: string;
  uploadedAt: string;
  originalName: string;
  is_trained?: boolean;
}

interface Article {
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
 * Trigger training directly from rhinon to backendai
 * This allows manual or automatic triggering of training without going through rtserver
 */
export const triggerTraining = async (chatbot_id: string) => {
  try {
    const response = await axios.post(`${aiApi}/api/ingest`, {
      chatbot_id,
    }, {
      timeout: 600000, // 10 minutes for large training sets
    });
    return response.data;
  } catch (error) {
    console.error("Failed to trigger training", error);
    throw error;
  }
};
