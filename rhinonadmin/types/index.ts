export interface User {
    _id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
}

export interface Role {
    _id: string;
    name: string;
    displayName: string;
    permissions: string[];
    isSystemRole: boolean;
    createdAt: Date;
}

export interface Permission {
    key: string;
    displayName: string;
    description: string;
    category: string;
}
