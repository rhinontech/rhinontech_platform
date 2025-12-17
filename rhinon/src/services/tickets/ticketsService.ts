import { PrivateAxios } from "@/helpers/PrivateAxios";

interface SendValue {
  provider: string;
  message: string;
  subject: string;
  attachment?: string;
}

export interface Conversation {
  role: string;
  text: string;
  attachments: any;
  timestamp: string; // ISO 8601 date string, not number
}

export interface Customer {
  id: number;
  organization_id: number;
  email: string;
  custom_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
}

export interface User {
  email: string;
  users_profile: UserProfile;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  customer_id: number;
  organization_id: number;
  assigned_user_id: number | null;
  subject: string;
  custom_data: Record<string, any>;
  conversations: Conversation[];
  is_new: boolean;
  status: string;
  priority: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  customer: Customer;
  user: User;
  rating: number;
}

export const createTickets = async (values: any) => {
  try {
    const response = await PrivateAxios.post(`/tickets/create-ticket`, values);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const fetchTickets = async () => {
  try {
    const response = await PrivateAxios.get(`/tickets`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const fetchTicketById = async (ticketId: string) => {
  try {
    const response = await PrivateAxios.get(`/tickets/ticket/${ticketId}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    throw error;
  }
};

export const fetchClosedTicketHistory = async (ticketId: string) => {
  try {
    const response = await PrivateAxios.get(
      `/tickets/tickets/${ticketId}/history`
    );
    return response.data.data; // always return data array
  } catch (error) {
    console.error("Failed to fetch closed ticket history:", error);
    throw error;
  }
};

export const fetchSupportEmails = async () => {
  try {
    const response = await PrivateAxios.get(`/tickets/emails`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const fetchSupportByEmailID = async (emailId: number) => {
  try {
    const response = await PrivateAxios.get(`/tickets/emails/${emailId}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch support email:", error);
    throw error;
  }
};

export const sendTicketEmail = async (
  ticketId: string,
  sendValues: SendValue
) => {
  try {
    const response = await PrivateAxios.post(
      `/tickets/reply-email/${ticketId}`,
      sendValues
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const markTicketAsRead = async (ticketId: string) => {
  try {
    const response = await PrivateAxios.put(
      `/tickets/update-ticket/${ticketId}`,
      {
        isOpened: true,
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

interface UpdateTicket {
  status?: string;
  priority?: string;
  assignee_id?: number;
}

export const updateTicket = async (ticketId: string, values: UpdateTicket) => {
  try {
    const response = await PrivateAxios.put(
      `/tickets/update-ticket/${ticketId}`,
      values
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch SEO compliance:", error);
    throw error;
  }
};

export const mergeSupportEmailToTicket = async (
  emailId: number,
  ticketId?: string | null
) => {
  try {
    const response = await PrivateAxios.post(
      "/tickets/emails/merge-support-email",
      {},
      {
        params: {
          emailId,
          ticketId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to merge email with ticket:", error);
    throw error;
  }
};

export const mergeGmailEmailToTicket = async (
  conversations: any[],
  email: string,
  ticketId?: string | null,
  subject?: string | null
) => {
  try {
    const response = await PrivateAxios.post(
      "/tickets/emails/merge-gmail-email",
      {
        conversations,
        ticketId: ticketId || null,
        email,
        subject: subject || null,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Failed to merge Gmail email with ticket:", error);
    throw error.response?.data || error;
  }
};
