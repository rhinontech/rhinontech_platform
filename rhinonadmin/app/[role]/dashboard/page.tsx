'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Building2, CreditCard, DollarSign, Activity, TrendingUp, ShieldCheck } from 'lucide-react';

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
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Dashboard
                    </h2>
                    <p className="text-muted-foreground">
                        Overview of your system performance and key metrics.
                    </p>
                </div>
                {stats.environment && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${stats.environment === 'prod'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                        }`}>
                        <span className={`relative flex h-2 w-2`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats.environment === 'prod' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${stats.environment === 'prod' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        </span>
                        {stats.environment.toUpperCase()} ENVIRONMENT
                    </div>
                )}
            </div>

            {isSuperAdmin ? (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Users
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    +20.1% from last month
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Organizations
                                </CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.totalOrgs || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    +12 since last week
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Subscriptions
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.activeSubs || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    +7% conversion rate
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    30-Day Revenue
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : `$${stats.monthlyRevenue || 0}`}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    +19% from last month
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4 shadow-sm">
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                                <CardDescription>
                                    Monthly user acquisition and revenue trends.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                                    <Activity className="h-8 w-8 opacity-20 mr-2" />
                                    <span>Chart placeholder for future implementation</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3 shadow-sm">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest system events and signups.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold mr-3">
                                                OP
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">New organization created</p>
                                                <p className="text-xs text-muted-foreground">Just now</p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs text-emerald-500">+1 Org</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Admins
                            </CardTitle>
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '...' : stats.totalAdmins || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Roles
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '...' : stats.totalRoles || 0}</div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Recent Logins
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '...' : stats.recentLogins || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
