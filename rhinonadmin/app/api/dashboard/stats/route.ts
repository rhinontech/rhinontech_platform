import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getPostgresPool } from '@/lib/postgres';
import { getDatabase } from '@/lib/mongodb';

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
            const pool = getPostgresPool(env as 'beta' | 'prod');

            try {
                const client = await pool.connect();

                try {
                    const [usersRes, orgsRes, subsRes, revenueRes] = await Promise.all([
                        client.query('SELECT COUNT(*) FROM "users"'),
                        client.query('SELECT COUNT(*) FROM "organizations"'),
                        client.query(
                            'SELECT COUNT(*) FROM "subscriptions" WHERE "subscription_end_date" > NOW()'
                        ),
                        client.query(`
              SELECT SUM(payment_amount) as total 
              FROM "transactions" 
              WHERE "payment_status" = 'success' 
              AND "created_at" > NOW() - INTERVAL '30 days'
            `),
                    ]);

                    const stats = {
                        totalUsers: parseInt(usersRes.rows[0].count, 10),
                        totalOrgs: parseInt(orgsRes.rows[0].count, 10),
                        activeSubs: parseInt(subsRes.rows[0].count, 10),
                        monthlyRevenue: parseInt(revenueRes.rows[0].total || '0', 10),
                        environment: env,
                    };

                    return Response.json(stats);
                } finally {
                    client.release();
                }
            } catch (error: any) {
                console.error('PostgreSQL error:', error);
                return Response.json(
                    { error: 'Database connection failed', details: error.message },
                    { status: 500 }
                );
            }
        } else {
            // For other roles, fetch MongoDB stats
            const db = await getDatabase();

            const [totalAdmins, totalRoles] = await Promise.all([
                db.collection('users').countDocuments({ isActive: true }),
                db.collection('roles').countDocuments(),
            ]);

            const stats = {
                totalAdmins,
                totalRoles,
                recentLogins: 0, // Placeholder
            };

            return Response.json(stats);
        }
    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
