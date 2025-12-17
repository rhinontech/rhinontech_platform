import axios from "axios";
import { PrivateAxios } from "@/helpers/PrivateAxios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getKnowledgeBase = async () => {
    try {
        const response = await PrivateAxios.get(`/kb/org`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch analytics data", error);
        throw error;
    }
};

export const uploadKBFileAndGetUrl = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await axios.post(
            `${API_URL}/aws/uploadKBFile`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error uploading KB file:", error);
        throw error;
    }
};

export const updateKnowledgeBaseTheme = async (requestbody: any) => {
    try {
        const response = await PrivateAxios.put(`/kb/theme`, requestbody);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch analytics data", error);
        throw error;
    }
};