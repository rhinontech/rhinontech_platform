import { PrivateAxios } from "@/helpers/PrivateAxios";

export interface SeedDataStatus {
    success: boolean;
    hasSeedData: boolean;
    count: number;
}

export interface SeedDataResponse {
    success: boolean;
    message: string;
    summary?: any;
}

export interface DeleteSeedDataResponse {
    success: boolean;
    message: string;
    deletionSummary?: any;
    registryEntriesDeleted?: number;
}

/**
 * Check if seed data exists for the current organization
 */
export const getSeedDataStatus = async (): Promise<SeedDataStatus> => {
    try {
        const response = await PrivateAxios.get("/seed-data/status");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch seed data status:", error);
        throw error;
    }
};

/**
 * Add seed data for the current organization
 */
export const addSeedData = async (): Promise<SeedDataResponse> => {
    try {
        const response = await PrivateAxios.post("/seed-data");
        return response.data;
    } catch (error) {
        console.error("Failed to add seed data:", error);
        throw error;
    }
};

/**
 * Delete all seed data for the current organization
 */
export const deleteSeedData = async (): Promise<DeleteSeedDataResponse> => {
    try {
        const response = await PrivateAxios.delete("/seed-data");
        return response.data;
    } catch (error) {
        console.error("Failed to delete seed data:", error);
        throw error;
    }
};
