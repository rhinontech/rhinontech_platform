import { PrivateAxios } from "@/helpers/PrivateAxios";

export const getActivities = async () => {
  try {
    const response = await PrivateAxios.get(`/user-details/activities`);
    return response.data;
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

export const getStatics = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get(`/user-details/dashboard-details`, {
      params: { chatbot_id },
    });
    return response.data?.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export const getOnboarding = async () => {
  try {
    const response = await PrivateAxios.get(`/user-details/onboarding`);
    return response.data?.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};
