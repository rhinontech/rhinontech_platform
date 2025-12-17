import { PrivateAxios } from "@/helpers/PrivateAxios";
import { Contact } from "lucide-react";

export const getUserProfileDetials = async () => {
  try {
    const response = await PrivateAxios.get(
      "/user-details/get-profile-details"
    );
    return response.data;
  } catch (error) {
    console.error("get profile details failed", error);
    throw error;
  }
};

export const updateUserProfileDetials = async (
  location: string,
  image_url: string,
  first_name: string,
  last_name: string,
  contact: string
) => {
  try {
    const response = await PrivateAxios.patch(
      "/user-details/update-profile-details",
      { location, image_url, first_name, last_name, contact }
    );
    return response.data;
  } catch (error) {
    console.error("update profile details failed", error);
    throw error;
  }
};

export const changePasswordFromProfile = async (
  oldPassword: string,
  newPassword: string
) => {
  try {
    const response = await PrivateAxios.post("/user-details/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("update profile details failed", error);
    throw error;
  }
};
