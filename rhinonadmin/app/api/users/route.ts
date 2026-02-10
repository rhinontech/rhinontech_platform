import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { hasPermission } from '@/lib/permissions';

// GET /api/users - List all users
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

        // Check if user has permission to view users
        if (!hasPermission(permissions, 'view_users')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all users (without passwords)
        const users = await db
            .collection('users')
            .find({}, { projection: { password: 0 } })
            .toArray();

        return Response.json({ users });
    } catch (error: any) {
        console.error('Get users error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/users - Create a new user
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

        // Check if user has permission to create users
        if (!hasPermission(permissions, 'create_users')) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { email, fullName, role, password } = await req.json();

        if (!email || !fullName || !role || !password) {
            return Response.json(
                { error: 'Email, fullName, role, and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return Response.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Verify role exists
        const roleDoc = await db.collection('roles').findOne({ name: role });
        if (!roleDoc) {
            return Response.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = {
            email,
            fullName,
            role,
            password: hashedPassword,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('users').insertOne(newUser);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return Response.json({
            user: { ...userWithoutPassword, _id: result.insertedId },
        });
    } catch (error: any) {
        console.error('Create user error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
