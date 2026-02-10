import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { comparePassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return Response.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        const db = await getDatabase();
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return Response.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (!user.isActive) {
            return Response.json(
                { error: 'Account is deactivated' },
                { status: 403 }
            );
        }

        // Verify password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return Response.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        // Set HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        // Return user data (without password)
        return Response.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
