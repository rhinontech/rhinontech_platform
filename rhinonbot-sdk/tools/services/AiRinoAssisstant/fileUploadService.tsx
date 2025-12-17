import axios from 'axios';

export const uploadConversationFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_NEW_SERVER_API_URL}/aws/fileUploadForConversation`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};
