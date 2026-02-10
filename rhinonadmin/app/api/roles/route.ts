import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { hasPermission } from '@/lib/permissions';

// GET /api/roles - List all roles
export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        const db = await getDatabase();

        // Get user's permissions
        const user = await db.collection('users').findOne({ email: payload.email });
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const userRole = await db.collection('roles').findOne({ name: user.role });
        const permissions = userRole?.permissions || [];

        // Check if user has permission to view roles
        if (!hasPermission(permissions, 'view_roles')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all roles
        const roles = await db.collection('roles').find({}).toArray();

        return Response.json({ roles });
    } catch (error: any) {
        console.error('Get roles error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/roles - Create a new role
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return Response.json({ error: 'Invalid token' }, { status: 401 });
        }

        const db = await getDatabase();

        // Get user's permissions
        const user = await db.collection('users').findOne({ email: payload.email });
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const userRole = await db.collection('roles').findOne({ name: user.role });
        const permissions = userRole?.permissions || [];

        // Check if user has permission to manage roles
        if (!hasPermission(permissions, 'manage_roles')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { name, displayName, permissions: rolePermissions } = await req.json();

        if (!name || !displayName || !rolePermissions) {
            return Response.json(
                { error: 'Name, displayName, and permissions are required' },
                { status: 400 }
            );
        }

        // Check if role already exists
        const existingRole = await db.collection('roles').findOne({ name });
        if (existingRole) {
            return Response.json(
                { error: 'Role with this name already exists' },
                { status: 409 }
            );
        }

        // Create new role
        const newRole = {
            name,
            displayName,
            permissions: rolePermissions,
            isSystemRole: false,
            createdAt: new Date(),
        };

        const result = await db.collection('roles').insertOne(newRole);

        return Response.json({
            role: { ...newRole, _id: result.insertedId },
        });
    } catch (error: any) {
        console.error('Create role error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
