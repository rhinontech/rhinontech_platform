import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { hasPermission } from '@/lib/permissions';
import { ObjectId } from 'mongodb';

// PUT /api/roles/[id] - Update a role
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const { displayName, permissions: rolePermissions } = await req.json();

        // Check if role exists
        const role = await db.collection('roles').findOne({ _id: new ObjectId(id) });
        if (!role) {
            return Response.json({ error: 'Role not found' }, { status: 404 });
        }

        // Prevent editing system roles
        if (role.isSystemRole) {
            return Response.json(
                { error: 'Cannot edit system roles' },
                { status: 403 }
            );
        }

        // Update role
        const result = await db.collection('roles').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    displayName: displayName || role.displayName,
                    permissions: rolePermissions || role.permissions,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.modifiedCount === 0) {
            return Response.json({ error: 'Failed to update role' }, { status: 500 });
        }

        const updatedRole = await db.collection('roles').findOne({ _id: new ObjectId(id) });

        return Response.json({ role: updatedRole });
    } catch (error: any) {
        console.error('Update role error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Check if role exists
        const role = await db.collection('roles').findOne({ _id: new ObjectId(id) });
        if (!role) {
            return Response.json({ error: 'Role not found' }, { status: 404 });
        }

        // Prevent deleting system roles
        if (role.isSystemRole) {
            return Response.json(
                { error: 'Cannot delete system roles' },
                { status: 403 }
            );
        }

        // Check if any users have this role
        const usersWithRole = await db.collection('users').findOne({ role: role.name });
        if (usersWithRole) {
            return Response.json(
                { error: 'Cannot delete role with assigned users' },
                { status: 409 }
            );
        }

        // Delete role
        await db.collection('roles').deleteOne({ _id: new ObjectId(id) });

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Delete role error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
