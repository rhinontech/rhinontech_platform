import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';

// GET /api/organizations - List all users with organization info (superadmin only)
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

        // Only superadmin can access this
        if (payload.role !== 'superadmin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get environment from cookie (default to beta)
        const env = cookieStore.get('NEXT_ADMIN_ENV')?.value || 'beta';
        const prisma = getPrismaClient(env as 'beta' | 'prod');

        try {
            // Fetch users with their organization, subscription, and role details using Prisma
            const users = await prisma.users.findMany({
                include: {
                    organizations: {
                        include: {
                            subscriptions: true,
                        },
                    },
                    users_roles: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });

            // Get user count for each organization
            const organizationUserCounts: Record<number, number> = {};
            const uniqueOrgIds = [...new Set(users.map((u: { organization_id: any; }) => u.organization_id).filter(Boolean))] as number[];

            for (const orgId of uniqueOrgIds) {
                organizationUserCounts[orgId] = await prisma.users.count({
                    where: { organization_id: orgId },
                });
            }

            // Transform to match frontend expected format
            const formattedUsers = users.map((user: { organizations: any; users_roles: any[]; id: any; email: any; phone_number: any; is_email_confirmed: any; is_onboarded: any; created_at: any; }) => {
                const org = user.organizations;
                const sub = org?.subscriptions?.[0]; // Get first subscription
                const role = user.users_roles?.[0]; // Get first role entry

                return {
                    userId: user.id,
                    userEmail: user.email,
                    phoneNumber: user.phone_number,
                    isEmailConfirmed: user.is_email_confirmed,
                    isOnboarded: user.is_onboarded ?? false,
                    userCreatedAt: user.created_at,
                    currentRole: role?.current_role ?? null,
                    assignedRoles: role?.assigned_roles ?? [],
                    organization: org
                        ? {
                            id: org.id,
                            name: org.organization_name,
                            email: org.company_email,
                            size: org.company_size,
                            type: org.organization_type,
                            createdAt: org.created_at,
                            userCount: organizationUserCounts[org.id] || 0,
                        }
                        : null,
                    subscription: sub
                        ? {
                            tier: sub.subscription_tier || 'None',
                            cycle: sub.subscription_cycle || 'N/A',
                            startDate: sub.subscription_start_date,
                            endDate: sub.subscription_end_date,
                            isActive: sub.subscription_end_date
                                ? new Date(sub.subscription_end_date) > new Date()
                                : false,
                        }
                        : {
                            tier: 'None',
                            cycle: 'N/A',
                            startDate: null,
                            endDate: null,
                            isActive: false,
                        },
                };
            });

            return Response.json({ users: formattedUsers, environment: env });
        } catch (error: any) {
            console.error('Prisma error:', error);
            return Response.json(
                { error: 'Database query failed', details: error.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Get organizations error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
