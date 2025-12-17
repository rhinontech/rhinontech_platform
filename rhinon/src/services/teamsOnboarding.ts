import { PrivateAxios } from "@/helpers/PrivateAxios";

interface IPasswordBody {
  token: string | null;
  password: string;
}

export const verifyTeamToken = async (token: string) => {
  try {
    const response = await PrivateAxios.get("/user-management/verify-token", {
      params: { token },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to verify token details", error);
    throw error;
  }
};

export const setPasswordForTeam = async (requestBody: IPasswordBody) => {
  try {
    const response = await PrivateAxios.post(
      `/user-management/set-password`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};
