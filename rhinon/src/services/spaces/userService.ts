import { PrivateAxios } from "@/helpers/PrivateAxios";
import { IUser } from "@/types/task";

// Backend user response type
interface BackendUser {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    image_url: string | null;
    current_role: string;
    assigned_roles: string[];
    organization_id: number;
    is_email_confirmed: boolean;
    location: string | null;
    contact: string | null;
    assigned_by: number | null;
    last_active: string;
    permissions: Record<string, any>;
    created_at: string;
    updated_at: string;
}

interface GetUsersResponse {
    message: string;
    data: BackendUser[];
}

// Convert backend user to Task user format
const mapBackendUserToTaskUser = (backendUser: BackendUser): IUser => {
    return {
        id: `${backendUser.user_id}`, // Convert to string ID
        name: `${backendUser.first_name} ${backendUser.last_name}`,
        email: backendUser.email,
        avatar: backendUser.image_url || undefined,
        role: backendUser.current_role,
    };
};

// Get all users for task assignment
// Get all users for task assignment
export const getUsersForTasks = async (): Promise<IUser[]> => {
    try {
        const response = await PrivateAxios.get<GetUsersResponse>(`/user-management/get-users`);

        // Map backend users to Task user format
        const users = response.data.data.map(mapBackendUserToTaskUser);

        return users;
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw error;
    }
};

// Get a single user by ID
export const getUserById = async (userId: number): Promise<IUser | null> => {
    try {
        const response = await PrivateAxios.get<GetUsersResponse>(`/user-management/get-users`);
        const backendUser = response.data.data.find(u => u.user_id === userId);

        if (!backendUser) return null;

        return mapBackendUserToTaskUser(backendUser);
    } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
        return null;
    }
};
