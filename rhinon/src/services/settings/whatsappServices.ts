import { PrivateAxios } from "@/helpers/PrivateAxios";

const API = "/whatsapp"; // base path since PrivateAxios already has baseURL

// Types
export interface WhatsAppAccount {
  id: number;
  phone_number_id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectAccountParams {
  code: string;
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
}

export interface SendMessageParams {
  account_id: number;
  to: string;
  type: "text" | "image" | "document" | "audio" | "video" | "template";
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: any;
  };
  media?: {
    link: string;
    caption?: string;
  };
}

export interface WhatsAppContact {
  id: number;
  phone_number: string;
  name: string | null;
  profile_name: string | null;
  last_message_at: string;
  unread_count?: number;
}

export interface WhatsAppMessage {
  id: number;
  message_id: string;
  from_number: string;
  to_number: string;
  direction: "inbound" | "outbound";
  message_type: string;
  content: string | null;
  media_url: string | null;
  caption: string | null;
  status: string;
  created_at: string;
}

/**
 * Connect WhatsApp Account
 */
export const connectWhatsAppAccount = async (params: ConnectAccountParams) => {
  try {
    const response = await PrivateAxios.post(`${API}/exchange-code`, params);
    return response.data;
  } catch (error) {
    console.error("Connect WhatsApp account error:", error);
    throw error;
  }
};

/**
 * Get all WhatsApp Accounts
 */
export const getWhatsAppAccounts = async (): Promise<WhatsAppAccount[]> => {
  try {
    const response = await PrivateAxios.get(`${API}/accounts`);
    return response.data.accounts || [];
  } catch (error) {
    console.error("Get WhatsApp accounts error:", error);
    throw error;
  }
};

/**
 * Disconnect WhatsApp Account
 */
export const disconnectWhatsAppAccount = async (accountId: number) => {
  try {
    const response = await PrivateAxios.delete(`${API}/accounts/${accountId}`);
    return response.data;
  } catch (error) {
    console.error("Disconnect WhatsApp account error:", error);
    throw error;
  }
};

/**
 * Set Default WhatsApp Account
 */
export const setDefaultWhatsAppAccount = async (accountId: number) => {
  try {
    const response = await PrivateAxios.put(`${API}/accounts/${accountId}/set-default`);
    return response.data;
  } catch (error) {
    console.error("Set default WhatsApp account error:", error);
    throw error;
  }
};

/**
 * Send WhatsApp Message
 */
export const sendWhatsAppMessage = async (params: SendMessageParams) => {
  try {
    const response = await PrivateAxios.post(`${API}/messages/send`, params);
    return response.data;
  } catch (error) {
    console.error("Send WhatsApp message error:", error);
    throw error;
  }
};

/**
 * Get WhatsApp Templates
 */
export const getWhatsAppTemplates = async (accountId: number) => {
  try {
    const response = await PrivateAxios.get(
      `${API}/templates?account_id=${accountId}`
    );
    return response.data.templates || [];
  } catch (error) {
    console.error("Get WhatsApp templates error:", error);
    throw error;
  }
};

/**
 * Get WhatsApp Contacts
 */
export const getWhatsAppContacts = async (accountId?: number) => {
  try {
    const url = accountId
      ? `${API}/contacts?account_id=${accountId}`
      : `${API}/contacts`;
    const response = await PrivateAxios.get(url);
    return response.data.contacts || [];
  } catch (error) {
    console.error("Get WhatsApp contacts error:", error);
    throw error;
  }
};

/**
 * Get WhatsApp Messages
 */
export const getWhatsAppMessages = async (contactId: number) => {
  try {
    const response = await PrivateAxios.get(
      `${API}/messages?contact_id=${contactId}`
    );
    return response.data;
  } catch (error) {
    console.error("Get WhatsApp messages error:", error);
    throw error;
  }
};

/**
 * Get WhatsApp Media Proxy URL
 */
export const getWhatsAppMediaUrl = (mediaUrl: string | null | undefined, accountId?: number | null) => {
  if (!mediaUrl) return "";

  // If it's a URL, checks if it's a Facebook/WhatsApp URL.
  // If it is, we MUST use the proxy because direct access causes 401 (Auth Error).
  // If it's a non-Facebook URL (e.g. S3, public link), we return it raw.
  if (mediaUrl.startsWith("http")) {
    const isFacebook = mediaUrl.includes("facebook.com") ||
      mediaUrl.includes("fbsbx.com") ||
      mediaUrl.includes("fbcdn.net") ||
      mediaUrl.includes("whatsapp.net");

    if (!isFacebook) {
      return mediaUrl;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || "";
  // If the mediaUrl is a full URL here (Facebook one), we encode it.
  // However, normally this should be an ID.
  return `${baseUrl}/api/whatsapp/media/${encodeURIComponent(mediaUrl)}?account_id=${accountId}`;
};

/**
 * Upload Media to Backend (which proxies to WhatsApp)
 */
export const uploadWhatsAppMedia = async (file: File, accountId: number) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("account_id", accountId.toString());

    // Note: We use the server base URL, not the proxy path if different, but here it matches schema
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || "";

    // We can use PrivateAxios if we want, but it needs multipart/form-data
    // Let's use PrivateAxios as it handles Auth headers automatically
    const response = await PrivateAxios.post(`${API}/upload-media`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data; // Should return { success: true, media_id: "..." }
  } catch (error) {
    console.error("Upload WhatsApp media error:", error);
    throw error;
  }
};
