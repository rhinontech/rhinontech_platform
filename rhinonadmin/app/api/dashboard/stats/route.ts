import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { getPrismaClient } from '@/lib/prisma';

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

        // Check if user is superadmin
        if (payload.role === 'superadmin') {
            // Get environment from cookie (default to beta)
            const env = cookieStore.get('NEXT_ADMIN_ENV')?.value || 'beta';
            const prisma = getPrismaClient(env as 'beta' | 'prod');

            try {
                const [totalUsers, totalOrgs, activeSubs] = await Promise.all([
                    prisma.users.count(),
                    prisma.organizations.count(),
                    prisma.subscriptions.count({
                        where: {
                            subscription_end_date: {
                                gt: new Date(),
                            },
                        },
                    }),
                ]);

                const stats = {
                    totalUsers,
                    totalOrgs,
                    activeSubs,
                    monthlyRevenue: 0, // TODO: Calculate from transactions if needed
                    environment: env,
                };

                return Response.json(stats);
            } catch (error: any) {
                console.error('Prisma error:', error);
                return Response.json(
                    { error: 'Database query failed', details: error.message },
                    { status: 500 }
                );
            }
        } else {
            // For other roles, fetch MongoDB stats
            try {
                const db = await getDatabase();

                const [totalBots] = await Promise.all([db.collection('bots').estimatedDocumentCount()]);

                const stats = {
                    totalBots,
                    totalUsers: 0,
                    activeSubscriptions: 0,
                    revenue: 0,
                };

                return Response.json(stats);
            } catch (error: any) {
                console.error('MongoDB error:', error);
                return Response.json(
                    { error: 'Database connection failed', details: error.message },
                    { status: 500 }
                );
            }
        }
    } catch (error: any) {
        console.error('Get stats error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
