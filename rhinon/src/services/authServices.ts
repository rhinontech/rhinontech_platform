import { PrivateAxios } from "@/helpers/PrivateAxios";
import { useUserStore } from "@/utils/store";
import axios from "axios";
import Cookies from "js-cookie";

interface ILoginBody {
  email: string;
  password: string;
}
interface IGoogleLoginBody {
  code: string;
}

interface IMicrosoftLoginBody {
  code: string;
  state: string;
  codeVerifier: string;
}

interface ISignUpBody {
  // organization_name: string;
  // first_name: string;
  // last_name: string;
  email: string;
  password: string;
  phone_number: string;
  // company_size: string;
}

interface ICompleteOnboardingBody {
  organization_name: string;
  first_name: string;
  last_name: string;
  company_size: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ILoginResponse {
  Result: "SUCCESS" | "Warning" | "NotVerified";
  Data?: string;
  Email?: string;
  Token?: string;
  Role?: string;
  is_onboarded?: boolean;
}

export const login = async (
  requestBody: ILoginBody
): Promise<ILoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, requestBody);
    return response.data; // Always return the backend response
  } catch (error: any) {
    // Optional: handle network errors
    console.error("Login request failed", error);
    throw error;
  }
};

export const googleLogin = async (requestBody: IGoogleLoginBody) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/google-login`,
      requestBody
    );

    return response.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const microsoftLogin = async (requestBody: IMicrosoftLoginBody) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/microsoft-login`,
      requestBody
    );

    return response.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const signup = async (requestBody: ISignUpBody) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/signup`,
      requestBody
    );

    return response.data;
  } catch (error) {
    console.error("Sign Up failed", error);
    throw error;
  }
};

export const googleSignup = async (requestBody: IGoogleLoginBody) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/google-signup`,
      requestBody
    );

    return response.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const microsoftSignup = async (requestBody: IMicrosoftLoginBody) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/microsoft-signup`,
      requestBody
    );

    return response.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const completeOnboarding = async (
  requestBody: ICompleteOnboardingBody
) => {
  try {
    const token = Cookies.get("signupToken"); // Get signup token from cookie
    if (!token) {
      throw new Error("No token found. Please log in again.");
    }

    const response = await axios.post(
      `${API_URL}/onboarding/complete-onboarding`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token directly
        },
      }
    );

    if (response.data.Result === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(
        response.data?.message || "Failed to complete onboarding"
      );
    }
  } catch (error) {
    console.error("Complete onboarding failed:", error);
    throw error;
  }
};

export const checkEmailRegistered = async (requestBody: { email: string }) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/check-email`,
      requestBody
    );
    // Always return response.data so UI can handle all cases
    return response.data;
  } catch (error) {
    console.error("Sign Up failed", error);
    throw error;
  }
};

export const resendEmailForSignUp = async (requestBody: { email: string }) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/resend-email`,
      requestBody
    );
    if (response.data.Result === "SUCCESS") {
      return response.data;
    }
  } catch (error) {
    console.error("Sign Up failed", error);
    throw error;
  }
};

export const verifyEmail = async (requestBody: {
  email: string;
  otp: string;
}) => {
  try {
    const response = await axios.post(
      `${API_URL}/onboarding/verify-email`,
      requestBody
    );

    return response.data;
  } catch (error) {
    console.error("Some Error occured", error);
    throw error;
  }
};

export const sendForgotPasswordEmail = async (requestBody: any) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/send-change-password-token`,
      requestBody
    );
    if (response.data.Result === "SUCCESS") {
      return response.data;
    }
  } catch (error) {
    console.error("Sign Up failed", error);
    throw error;
  }
};

export const verifyChangePasswordToken = async (requestBody: {
  token: string;
}) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/verify-change-password-token`,
      requestBody
    );
    console.log("API Response for token verification:", response.data);
    return response.data;
  } catch (error) {
    console.error("Token verification failed", error);
    throw error;
  }
};

export const changePasswordWithToken = async (requestBody: {
  token: string;
  password: string;
}) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/change-password`,
      requestBody
    );
    console.log("API Response for password change:", response.data);
    return response.data;
  } catch (error) {
    console.error("Password change failed", error);
    throw error;
  }
};

export const getUserDetails = async () => {
  try {
    const response = await PrivateAxios.get(`${API_URL}/user-details`);

    return response.data.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const changeUserRole = async (role: string) => {
  try {
    const response = await PrivateAxios.post(
      `${API_URL}/user-details/change-role`,
      { role }
    );

    return response.data;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = (): void => {
  Cookies.remove("authToken");
  Cookies.remove("currentRole");
  Cookies.remove("sessionId");
  Cookies.remove("isPlanValid");
  Cookies.remove("roleAccess");
  localStorage.removeItem("copilot_messages");
  localStorage.removeItem("googleRefreshToken");
  localStorage.removeItem("googleTokenExpiry");
  localStorage.removeItem("microsoftRefreshToken");
  localStorage.removeItem("microsoftTokenExpiry");
  useUserStore.persist.clearStorage();
};
