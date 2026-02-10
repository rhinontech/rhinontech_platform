export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',
    SWITCH_ENV: 'switch_env',

    // Users
    VIEW_USERS: 'view_users',
    CREATE_USERS: 'create_users',
    EDIT_USERS: 'edit_users',
    DELETE_USERS: 'delete_users',

    // Roles
    VIEW_ROLES: 'view_roles',
    MANAGE_ROLES: 'manage_roles',

    // Settings
    VIEW_SETTINGS: 'view_settings',
    EDIT_SETTINGS: 'edit_settings',
} as const;

export const PERMISSION_CATEGORIES = [
    {
        name: 'Dashboard',
        permissions: [
            {
                key: PERMISSIONS.VIEW_DASHBOARD,
                displayName: 'View Dashboard',
                description: 'Access to view dashboard metrics',
            },
            {
                key: PERMISSIONS.SWITCH_ENV,
                displayName: 'Switch Environment',
                description: 'Ability to switch between Beta and Production environments',
            },
        ],
    },
    {
        name: 'Users',
        permissions: [
            {
                key: PERMISSIONS.VIEW_USERS,
                displayName: 'View Users',
                description: 'View list of users',
            },
            {
                key: PERMISSIONS.CREATE_USERS,
                displayName: 'Create Users',
                description: 'Create new users',
            },
            {
                key: PERMISSIONS.EDIT_USERS,
                displayName: 'Edit Users',
                description: 'Modify existing users',
            },
            {
                key: PERMISSIONS.DELETE_USERS,
                displayName: 'Delete Users',
                description: 'Remove users from the system',
            },
        ],
    },
    {
        name: 'Roles',
        permissions: [
            {
                key: PERMISSIONS.VIEW_ROLES,
                displayName: 'View Roles',
                description: 'View list of roles',
            },
            {
                key: PERMISSIONS.MANAGE_ROLES,
                displayName: 'Manage Roles',
                description: 'Create, edit, and delete roles',
            },
        ],
    },
    {
        name: 'Settings',
        permissions: [
            {
                key: PERMISSIONS.VIEW_SETTINGS,
                displayName: 'View Settings',
                description: 'Access to view system settings',
            },
            {
                key: PERMISSIONS.EDIT_SETTINGS,
                displayName: 'Edit Settings',
                description: 'Modify system settings',
            },
        ],
    },
];

// Helper function to check permission
export function hasPermission(
    userPermissions: string[],
    requiredPermission: string
): boolean {
    // Wildcard (*) grants all permissions (superadmin)
    if (userPermissions.includes('*')) {
        return true;
    }
    return userPermissions.includes(requiredPermission);
}

// Helper to check multiple permissions (requires ALL)
export function hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
): boolean {
    if (userPermissions.includes('*')) {
        return true;
    }
    return requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
    );
}

// Helper to check multiple permissions (requires ANY)
export function hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[]
): boolean {
    if (userPermissions.includes('*')) {
        return true;
    }
    return requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
    );
}
