import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  fileName: string;
}

interface UploadResponse {
  message: string;
  imageName: string;
  key: string;
}

interface UploadPdfResponse {
  message: string;
  fileName: string;
  key: string;
}

// 1. Get the "Permission Slip" (Signed URL)
const getPresignedUpload = async (fileName: string, fileType: string, folder?: string): Promise<PresignedUploadResponse> => {
  try {
    const response = await axios.post(`${API_URL}/aws/presigned-upload`, {
      fileName,
      fileType,
      folder
    });
    return response.data;
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    throw error;
  }
}

// 2. Upload directly to AWS S3
const uploadToS3 = async (uploadUrl: string, file: File) => {
  try {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

export const uploadImageFile = async (file: File): Promise<UploadResponse> => {
  try {
    // A. Get Signed URL
    const { uploadUrl, key, fileName } = await getPresignedUpload(file.name, file.type, "images");

    // B. Upload to S3
    await uploadToS3(uploadUrl, file);

    return {
      message: "Image uploaded successfully",
      imageName: fileName,
      key: key
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadPdfFile = async (file: File): Promise<UploadPdfResponse> => {
  try {
    // A. Get Signed URL
    const { uploadUrl, key, fileName } = await getPresignedUpload(file.name, file.type);

    // B. Upload to S3
    await uploadToS3(uploadUrl, file);

    return {
      message: "File uploaded successfully",
      fileName: fileName,
      key: key
    };
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
};

// Legacy support or specific conversation upload if needed by Dashboard
export const uploadFileAndGetFullUrl = async (file: File, folder: string = "attachments") => {
  try {
    // A. Get Signed URL
    const { uploadUrl, key, fileName } = await getPresignedUpload(file.name, file.type, folder);

    // B. Upload to S3
    await uploadToS3(uploadUrl, file);

    return {
      message: "File uploaded successfully",
      fileName: fileName, // Maintain interface compatibility
      key: key,
      // url: ... we don't have a public URL anymore depending on bucket privacy
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// New: Secure View Link
export const getSecureViewUrl = async (key: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/aws/presigned-url`, { key });
    return response.data.downloadUrl;
  } catch (error) {
    console.error("Error getting secure view URL:", error);
    return "";
  }
}
