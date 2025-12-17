import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UploadResponse {
  message: string;
  imageName: string;
}

export const uploadImageFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await axios.post<UploadResponse>(
      `${API_URL}/aws/uploadImg`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

interface UploadPdfResponse {
  message: string;
  fileName: string;
}

export const uploadPdfFile = async (file: File): Promise<UploadPdfResponse> => {
  const formData = new FormData();
  formData.append("file", file); // Changed "pdf" to "file" to match backend

  try {
    const response = await axios.post<UploadPdfResponse>(
      `${API_URL}/aws/uploadPdf`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
};

export const uploadFileAndGetFullUrl = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await axios.post(
      `${API_URL}/aws/fileUploadForConversation`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
