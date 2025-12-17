import { PrivateAxios } from "@/helpers/PrivateAxios";
import axios from "axios";

interface Article {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export const createOrUpdateAutomation = async (data: {
  training_url?: { url: string; updatedAt: string }[];
  training_pdf?:
    | string[]
    | (string | { s3Name: string; originalName: string })[]
    | (string | { s3Name: string; originalName: string })[]
    | undefined;
  training_article?: Article[] | undefined;
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
