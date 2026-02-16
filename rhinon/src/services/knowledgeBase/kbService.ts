import axios from "axios";
import { PrivateAxios } from "@/helpers/PrivateAxios";
import { uploadFileAndGetFullUrl } from "../fileUploadService";

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

export const uploadKBFileAndGetUrl = async (file: File) => {
    try {
        const response = await uploadFileAndGetFullUrl(file, "kb");
        // Maintain compatibility with existing code expecting .url check
        // Ideally we should update the consumer to use .key
        return {
            ...response,
            url: response.key
        };
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