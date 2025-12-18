// File upload service
import axios from 'axios';
import { getServerApiUrl } from '../api';
import { ENDPOINTS } from '../api/endpoints';

export interface UploadResult {
  url: string;
  fileName: string;
}

/**
 * Upload a file for conversation attachments
 */
export const uploadConversationFile = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    `${getServerApiUrl()}${ENDPOINTS.FILE_UPLOAD_CONVERSATION}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};
