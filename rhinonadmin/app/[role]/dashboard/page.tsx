'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, CreditCard, DollarSign } from 'lucide-react';

interface SuperAdminStats {
    totalUsers: number;
    totalOrgs: number;
    activeSubs: number;
    monthlyRevenue: number;
    environment: string;
}

interface AdminStats {
    totalAdmins: number;
    totalRoles: number;
    recentLogins: number;
}

export default function DashboardPage({
    params
}: {
    params: Promise<{ role: string }>
}) {
    const { role } = use(params);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const isSuperAdmin = role === 'superadmin';

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                    Welcome back!
                </h2>
                <p className="text-neutral-500 mt-1">
                    Here's what's happening with your system today.
                </p>
            </div>

            {isSuperAdmin ? (
                <>
                    {stats.environment && (
                        <div className="mb-4 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                            Environment: {stats.environment.toUpperCase()}
                        </div>
                    )}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-500">
                                    Total Users
                                </CardTitle>
                                <Users className="h-4 w-4 text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {loading ? '...' : stats.totalUsers || 0}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">Registered users</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-500">
                                    Organizations
                                </CardTitle>
                                <Building2 className="h-4 w-4 text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {loading ? '...' : stats.totalOrgs || 0}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">Total companies</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-500">
                                    Active Subscriptions
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {loading ? '...' : stats.activeSubs || 0}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">Current active plans</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-neutral-500">
                                    30-Day Revenue
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-neutral-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {loading ? '...' : `$${stats.monthlyRevenue || 0}`}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">
                                    From successful transactions
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                Total Admins
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {loading ? '...' : stats.totalAdmins || 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                Total Roles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {loading ? '...' : stats.totalRoles || 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                Recent Logins
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {loading ? '...' : stats.recentLogins || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
