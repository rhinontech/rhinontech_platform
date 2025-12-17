import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface Role {
  roleName: string;
  roleAccess: string[];
}
export interface User {
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  permissions: Record<string, any>;
}

export interface UpdateUser {
  user_id: number;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions?: Record<string, any>;
}

export const createRole = async (requestBody: Role) => {
  try {
    const response = await PrivateAxios.post(
      `/user-management/create-role`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

export const getRoles = async () => {
  try {
    const response = await PrivateAxios.get(`/user-management/get-roles`);
    return response.data;
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

export const updateRole = async (oldRoleName: string, requestBody: Role) => {
  try {
    const response = await PrivateAxios.put(
      `/user-management/update-role`,
      requestBody,
      {
        params: { oldRoleName },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

export const deleteRole = async (roleName: string) => {
  try {
    const response = await PrivateAxios.delete(`/user-management/delete-role`, {
      params: { roleName },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await PrivateAxios.get(`/user-management/get-users`);
    return response.data;
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

export const createUser = async (requestBody: User) => {
  try {
    const response = await PrivateAxios.post(
      `/user-management/create-user`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

export const updateUser = async (requestBody: UpdateUser) => {
  try {
    const response = await PrivateAxios.put(
      `/user-management/update-user`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const response = await PrivateAxios.delete(`/user-management/delete-user`, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
