import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return Response.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify JWT
        const payload = verifyToken(token);
        if (!payload) {
            return Response.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Fetch user from database
        const db = await getDatabase();
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(payload.userId) },
            { projection: { password: 0 } } // Exclude password
        );

        if (!user || !user.isActive) {
            return Response.json(
                { error: 'User not found or inactive' },
                { status: 404 }
            );
        }

        // Fetch user's role permissions
        const role = await db.collection('roles').findOne({ name: user.role });

        return Response.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                permissions: role?.permissions || [],
            },
        });
    } catch (error: any) {
        console.error('Auth verification error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
