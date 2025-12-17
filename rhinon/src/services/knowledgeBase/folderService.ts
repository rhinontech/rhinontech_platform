import { PrivateAxios } from "@/helpers/PrivateAxios";

interface CreateFolder {
  name: string;
  description?: string;
}

export const fetchFoldersWithArticles = async () => {
  try {
    const response = await PrivateAxios.get("/kb/org");

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
  // return {
  //   orgId: 1,
  //   folders: [
  //     {
  //       folderId: "1",
  //       name: "Getting Started",
  //       articles: [
  //         {
  //           id: "1",
  //           title: "Welcome to our Help Center",
  //           content: "Learn the basics and get started with our platform.",
  //           status: "published",
  //           views: 150,
  //           likes: 45,
  //           dislikes: 5,
  //           updated_at: "2024-01-10",
  //           created_at: "2024-01-01",
  //         },
  //         {
  //           id: "2",
  //           title: "Account Setup Guide",
  //           content: "Step-by-step guide to set up your account.",
  //           status: "published",
  //           views: 200,
  //           likes: 78,
  //           dislikes: 2,
  //           updated_at: "2024-01-09",
  //           created_at: "2024-01-02",
  //         },
  //         {
  //           id: "3",
  //           title: "First Steps Tutorial",
  //           content: "Your first tutorial to get familiar with the platform.",
  //           status: "published",
  //           views: 120,
  //           likes: 55,
  //           dislikes: 3,
  //           updated_at: "2024-01-08",
  //           created_at: "2024-01-03",
  //         },
  //       ],
  //     },
  //     {
  //       folderId: "2",
  //       name: "Account & Security",
  //       articles: [
  //         {
  //           id: "4",
  //           title: "How to Reset Your Password",
  //           content: "Instructions for resetting your password securely.",
  //           status: "published",
  //           views: 300,
  //           likes: 120,
  //           dislikes: 8,
  //           updated_at: "2024-01-11",
  //           created_at: "2024-01-04",
  //         },
  //         {
  //           id: "5",
  //           title: "Two-Factor Authentication",
  //           content: "Enable 2FA for enhanced account security.",
  //           status: "published",
  //           views: 250,
  //           likes: 95,
  //           dislikes: 5,
  //           updated_at: "2024-01-10",
  //           created_at: "2024-01-05",
  //         },
  //         {
  //           id: "6",
  //           title: "Privacy Settings",
  //           content: "Manage your privacy preferences and data sharing.",
  //           status: "published",
  //           views: 180,
  //           likes: 70,
  //           dislikes: 4,
  //           updated_at: "2024-01-07",
  //           created_at: "2024-01-06",
  //         },
  //       ],
  //     },
  //     {
  //       folderId: "3",
  //       name: "Troubleshooting",
  //       articles: [
  //         {
  //           id: "7",
  //           title: "Login Issues",
  //           content: "Solutions for common login problems.",
  //           status: "published",
  //           views: 220,
  //           likes: 60,
  //           dislikes: 15,
  //           updated_at: "2024-01-12",
  //           created_at: "2024-01-07",
  //         },
  //         {
  //           id: "8",
  //           title: "Performance & Speed",
  //           content: "Optimize your experience for better performance.",
  //           status: "published",
  //           views: 175,
  //           likes: 50,
  //           dislikes: 10,
  //           updated_at: "2024-01-06",
  //           created_at: "2024-01-08",
  //         },
  //       ],
  //     },
  //   ],
  // };
};

export const createFolder = async (requestBody: CreateFolder) => {
  try {
    const response = await PrivateAxios.post("/folders", requestBody);

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const deleteFolder = async (folderId: string) => {
  try {
    const response = await PrivateAxios.delete(`/folders/${folderId}`);

    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};
