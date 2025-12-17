import axios from "axios";
import { PrivateAxios } from "@/helpers/PrivateAxios";

/**
 * Get LinkedIn authorization URL
 */
export const getLinkedInAuthUrl = async () => {
  try {
    const response = await PrivateAxios.get("/linkedin/auth");
    return response.data;
  } catch (error) {
    console.error("Error getting LinkedIn auth URL:", error);
    throw error;
  }
};

/**
 * Get LinkedIn connection status
 */
export const getLinkedInStatus = async () => {
  try {
    const response = await PrivateAxios.get("/linkedin/status");
    return response.data;
  } catch (error) {
    console.error("Error getting LinkedIn status:", error);
    throw error;
  }
};

/**
 * Disconnect LinkedIn account
 */
export const disconnectLinkedIn = async () => {
  try {
    const response = await PrivateAxios.post("/linkedin/disconnect");
    return response.data;
  } catch (error) {
    console.error("Error disconnecting LinkedIn:", error);
    throw error;
  }
};

/**
 * Refresh LinkedIn access token
 */
export const refreshLinkedInToken = async () => {
  try {
    const response = await PrivateAxios.post("/linkedin/refresh-token");
    return response.data;
  } catch (error) {
    console.error("Error refreshing LinkedIn token:", error);
    throw error;
  }
};

/**
 * Get LinkedIn user profile from access token
 */
export const getLinkedInUserInfo = async (accessToken: string) => {
  try {
    const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching LinkedIn user info:", error);
    throw error;
  }
};
