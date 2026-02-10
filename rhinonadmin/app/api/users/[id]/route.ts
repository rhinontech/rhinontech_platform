import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { hasPermission } from '@/lib/permissions';
import { ObjectId } from 'mongodb';

// PUT /api/users/[id] - Update a user
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

        // Check if user has permission to edit users
        if (!hasPermission(permissions, 'edit_users')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { fullName, role, isActive, password } = await req.json();

        // Check if target user exists
        const targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify role exists if role is being updated
        if (role) {
            const roleDoc = await db.collection('roles').findOne({ name: role });
            if (!roleDoc) {
                return Response.json({ error: 'Invalid role' }, { status: 400 });
            }
        }

        // Build update object
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (fullName) updateData.fullName = fullName;
        if (role) updateData.role = role;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (password) updateData.password = await hashPassword(password);

        // Update user
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return Response.json({ error: 'Failed to update user' }, { status: 500 });
        }

        const updatedUser = await db
            .collection('users')
            .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });

        return Response.json({ user: updatedUser });
    } catch (error: any) {
        console.error('Update user error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete a user
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

        // Check if user has permission to delete users
        if (!hasPermission(permissions, 'delete_users')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if target user exists
        const targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deleting yourself
        if (targetUser.email === payload.email) {
            return Response.json(
                { error: 'Cannot delete your own account' },
                { status: 403 }
            );
        }

        // Delete user
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
