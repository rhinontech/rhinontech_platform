import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface IProvider {
    provider: string
}

export interface IAuthProvider {
    provider: string;
    access_token: string;
    id_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expires_in: number;
}


export const getUser = async (requestBody: IProvider) => {
    try {
        const response = await PrivateAxios.post(`/provider/get-user`, requestBody);
        return response.data;
    } catch (error) {
        console.error("Error", error);
        throw error;
    }
};

export const updateOrCreateUser = async (requestBody: IAuthProvider) => {
    try {
        const response = await PrivateAxios.post(`/provider/user`, requestBody);
        return response.data;
    } catch (error) {
        console.error("Error", error);
        throw error;
    }
};

export const deleteUser = async (provider: string) => {
    try {
        const response = await PrivateAxios.delete(`/provider/delete-user?provider=${provider}`);
        return response.data;
    } catch (error) {
        console.error("Error", error);
        throw error;
    }
};