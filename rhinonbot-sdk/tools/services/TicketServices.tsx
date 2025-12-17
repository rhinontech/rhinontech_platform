import axios from 'axios';

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;

interface GetTicketProps {
  chatbot_id: number;
  user_email: string;
}

interface Conversation {
  role: string;
  text: string;
}

interface TicketValues {
  chatbot_id: string;
  customer_email: string;
  subject: string;
  conversations: Conversation[];
  custom_data?: Record<string, string>;
}

export const submitTickets = async (values: TicketValues) => {
  try {
    const response = await axios.post(
      `${serverUrl}/tickets/create-from-ticket`,
      {
        ...values,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get all conversations', error);
    throw error;
  }
};

export const getTicketsStatus = async (
  chatbot_id: string,
  user_email: string,
) => {
  try {
    const response = await axios.post(`${serverUrl}/tickets/get-tickets`, {
      chatbot_id: chatbot_id,
      user_email: user_email,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get tickets status', error);
    throw error;
  }
};

export const updateTicketRating = async (ticket_id: string, rating: number) => {
  try {
    const response = await axios.post(`${serverUrl}/tickets/ticket-rating`, {
      ticket_id,
      rating,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update ticket rating', error);
    throw error;
  }
};
