'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Building2, Users, CheckCircle, XCircle, Mail, Phone, Calendar } from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    email: string;
    size: string;
    type: string;
    createdAt: string;
    userCount: number;
}

interface Subscription {
    tier: string;
    cycle: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
}

interface User {
    userId: number;
    userEmail: string;
    phoneNumber: string | null;
    isEmailConfirmed: boolean;
    isOnboarded: boolean;
    userCreatedAt: string;
    currentRole: string;
    assignedRoles: string[];
    organization: Organization;
    subscription: Subscription;
}

export default function OrganizationsPage({
    params,
}: {
    params: Promise<{ role: string }>;
}) {
    use(params);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [environment, setEnvironment] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/organizations');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setEnvironment(data.environment);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setDrawerOpen(true);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTierBadgeColor = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'premium':
                return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
            case 'professional':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            case 'basic':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            default:
                return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200';
        }
    };

    const uniqueOrgs = [...new Set(users.map((u) => u.organization.id))].length;
    const activeSubscriptions = users.filter((u) => u.subscription.isActive).length;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        Organization Users
                    </h2>
                    <p className="text-neutral-500 mt-1">
                        View all users and their organization details
                    </p>
                </div>
                {environment && (
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {environment.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {loading ? '...' : users.length}
                        </div>
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
                            {loading ? '...' : uniqueOrgs}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">
                            Active Subscriptions
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {loading ? '...' : activeSubscriptions}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-neutral-500">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">No users found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow
                                        key={user.userId}
                                        onClick={() => handleUserClick(user)}
                                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {user.userEmail}
                                                {user.isEmailConfirmed && (
                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.organization.name}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded text-xs capitalize">
                                                {user.currentRole || 'User'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(
                                                    user.subscription.tier
                                                )}`}
                                            >
                                                {user.subscription.tier}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {user.subscription.isActive ? (
                                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-neutral-500 text-sm">
                                                    <XCircle className="h-3 w-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-neutral-500">
                                            {formatDate(user.userCreatedAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Right Drawer for Organization Details */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    {selectedUser && (
                        <>
                            <SheetHeader>
                                <SheetTitle>User & Organization Details</SheetTitle>
                                <SheetDescription>
                                    Complete information about the user and their organization
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                {/* User Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">User Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Mail className="h-4 w-4 mt-1 text-neutral-500" />
                                            <div>
                                                <div className="text-sm font-medium">Email</div>
                                                <div className="text-sm text-neutral-600">
                                                    {selectedUser.userEmail}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedUser.phoneNumber && (
                                            <div className="flex items-start gap-2">
                                                <Phone className="h-4 w-4 mt-1 text-neutral-500" />
                                                <div>
                                                    <div className="text-sm font-medium">Phone</div>
                                                    <div className="text-sm text-neutral-600">
                                                        {selectedUser.phoneNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-4 w-4 mt-1 text-neutral-500" />
                                            <div>
                                                <div className="text-sm font-medium">Joined</div>
                                                <div className="text-sm text-neutral-600">
                                                    {formatDate(selectedUser.userCreatedAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${selectedUser.isEmailConfirmed
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {selectedUser.isEmailConfirmed ? 'Email Verified' : 'Email Unverified'}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${selectedUser.isOnboarded
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-neutral-100 text-neutral-800'
                                                    }`}
                                            >
                                                {selectedUser.isOnboarded ? 'Onboarded' : 'Not Onboarded'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Organization Information */}
                                <div className="pt-4 border-t">
                                    <h3 className="text-lg font-semibold mb-3">Organization</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm font-medium">Name</div>
                                            <div className="text-sm text-neutral-600">
                                                {selectedUser.organization.name}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Email</div>
                                            <div className="text-sm text-neutral-600">
                                                {selectedUser.organization.email}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-sm font-medium">Size</div>
                                                <div className="text-sm text-neutral-600">
                                                    {selectedUser.organization.size}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">Type</div>
                                                <div className="text-sm text-neutral-600">
                                                    {selectedUser.organization.type}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Total Users</div>
                                            <div className="text-sm text-neutral-600">
                                                {selectedUser.organization.userCount}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Created</div>
                                            <div className="text-sm text-neutral-600">
                                                {formatDate(selectedUser.organization.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Information */}
                                <div className="pt-4 border-t">
                                    <h3 className="text-lg font-semibold mb-3">Subscription</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-sm font-medium">Tier</div>
                                                <span
                                                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getTierBadgeColor(
                                                        selectedUser.subscription.tier
                                                    )}`}
                                                >
                                                    {selectedUser.subscription.tier}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">Cycle</div>
                                                <div className="text-sm text-neutral-600 mt-1">
                                                    {selectedUser.subscription.cycle}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Status</div>
                                            <div className="mt-1">
                                                {selectedUser.subscription.isActive ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-neutral-500 text-sm">
                                                        <XCircle className="h-4 w-4" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-sm font-medium">Start Date</div>
                                                <div className="text-sm text-neutral-600">
                                                    {formatDate(selectedUser.subscription.startDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">End Date</div>
                                                <div className="text-sm text-neutral-600">
                                                    {formatDate(selectedUser.subscription.endDate)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
