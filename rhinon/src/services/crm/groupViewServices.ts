import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface ICreateGroup {
  group_name: string;
  manage_type: string;
}

export interface ICreateGroupView {
  view_name: string;
  view_type: string;
  view_manage_type: string;
}

export const getAllGroupsWithView = async () => {
  try {
    const response = await PrivateAxios.get(`/crm/groups/groups`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const createGroup = async (requestbody: ICreateGroup) => {
  try {
    const response = await PrivateAxios.post(`/crm/groups/group`, requestbody);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const createGroupView = async (
  group_id: number,
  requestbody: ICreateGroupView
) => {
  try {
    const response = await PrivateAxios.post(
      `/crm/groups/${group_id}/view`,
      requestbody
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const deleteGroup = async (group_id: string) => {
  try {
    const response = await PrivateAxios.delete(`/crm/groups/${group_id}/group`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const deleteView = async (view_id: string) => {
  try {
    const response = await PrivateAxios.delete(`/crm/groups/${view_id}/view`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await PrivateAxios.get(`/crm/groups/dashboard`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch dashboard analytics", error);
    throw error;
  }
};
