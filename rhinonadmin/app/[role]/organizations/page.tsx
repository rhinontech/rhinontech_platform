'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Building2,
    Users,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    Calendar,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpRight,
    Shield
} from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    organization: Organization | null;
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
    const [searchQuery, setSearchQuery] = useState('');

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
                // Ideally use a toast here instead of alert
                console.error(data.error || 'Failed to fetch users');
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
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTierBadgeVariant = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'premium':
                return 'default'; // dark/primary
            case 'professional':
                return 'secondary';
            case 'basic':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const uniqueOrgs = [...new Set(users.filter((u) => u.organization).map((u) => u.organization!.id))].length;
    const activeSubscriptions = users.filter((u) => u.subscription.isActive).length;

    const filteredUsers = users.filter(user =>
        user.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.organization?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Organizations & Users
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your platform organizations, user access, and subscription status.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {environment && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${environment === 'prod'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                            }`}>
                            <span className={`relative flex h-2 w-2`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${environment === 'prod' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${environment === 'prod' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            </span>
                            {environment.toUpperCase()} ENVIRONMENT
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : users.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Registered accounts across platform
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : uniqueOrgs}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Companies onboarded
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Paying customers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Content Section */}
            <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Directory</CardTitle>
                            <CardDescription>A list of all users and their organization details.</CardDescription>
                        </div>
                        <div className="flex w-full items-center space-x-2 md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search users..."
                                    className="h-9 w-[200px] lg:w-[300px] pl-9 bg-background/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <p className="text-sm">Loading directory...</p>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex h-[400px] flex-col items-center justify-center text-muted-foreground">
                            <Users className="h-12 w-12 opacity-20 mb-4" />
                            <p>No users found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[300px]">User</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Subscription</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow
                                            key={user.userId}
                                            onClick={() => handleUserClick(user)}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-2">
                                                        {user.userEmail}
                                                        {user.isEmailConfirmed && (
                                                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                        )}
                                                    </span>
                                                    {user.phoneNumber && (
                                                        <span className="text-xs text-muted-foreground">{user.phoneNumber}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.organization ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                                                            {user.organization.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium leading-none">{user.organization.name}</span>
                                                            <span className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                                                                {user.organization.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm italic">No Organization</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal capitalize">
                                                    {user.currentRole || 'User'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`capitalize font-medium ${user.subscription.tier === 'Premium' ? 'border-purple-500/30 text-purple-600 bg-purple-50 dark:bg-purple-900/10 dark:text-purple-400' : ''
                                                    }`}>
                                                    {user.subscription.tier}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.subscription.isActive ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="text-sm text-muted-foreground">Active</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                        <span className="text-sm text-muted-foreground">Inactive</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {formatDate(user.userCreatedAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Right Drawer for User Details */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto border-l border-border/50 sm:max-w-md p-4">
                    {selectedUser && (
                        <div className="flex flex-col h-full">
                            <SheetHeader className="pb-6 border-b">
                                <SheetTitle className="text-xl">User Profile</SheetTitle>
                                <SheetDescription>
                                    Detailed information and organization association.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 py-6 space-y-8">
                                {/* Profile Header */}
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                        {selectedUser.userEmail.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedUser.userEmail}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Joined {formatDate(selectedUser.userCreatedAt)}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant={selectedUser.isEmailConfirmed ? "default" : "destructive"}>
                                                {selectedUser.isEmailConfirmed ? 'Verified' : 'Unverified'}
                                            </Badge>
                                            <Badge variant="outline">
                                                {selectedUser.isOnboarded ? 'Onboarded' : 'Pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-6">
                                    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Info</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground block mb-1">Email Address</label>
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {selectedUser.userEmail}
                                                </div>
                                            </div>
                                            {selectedUser.phoneNumber && (
                                                <div>
                                                    <label className="text-xs text-muted-foreground block mb-1">Phone Number</label>
                                                    <div className="text-sm font-medium flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {selectedUser.phoneNumber}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Organization Card */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Organization
                                            </h4>
                                            {selectedUser.organization && (
                                                <Badge variant="secondary" className="text-xs">
                                                    ID: {selectedUser.organization.id}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            {selectedUser.organization ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <h5 className="text-lg font-bold">{selectedUser.organization.name}</h5>
                                                        <p className="text-sm text-muted-foreground">{selectedUser.organization.type}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground block text-xs mb-0.5">Size</span>
                                                            <span className="font-medium">{selectedUser.organization.size}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground block text-xs mb-0.5">Members</span>
                                                            <span className="font-medium">{selectedUser.organization.userCount} Users</span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <span className="text-muted-foreground block text-xs mb-0.5">Contact</span>
                                                            <span className="font-medium">{selectedUser.organization.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                    <p>No organization associated</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subscription Card */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Subscription
                                            </h4>
                                            <Badge variant={selectedUser.subscription.isActive ? "default" : "secondary"}>
                                                {selectedUser.subscription.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-xs text-muted-foreground block mb-1">Plan Tier</label>
                                                    <div className="font-semibold text-lg">{selectedUser.subscription.tier}</div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground block mb-1">Billing Cycle</label>
                                                    <div className="font-medium capitalize">{selectedUser.subscription.cycle}</div>
                                                </div>
                                                <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
                                                        <div className="text-sm">{formatDate(selectedUser.subscription.startDate)}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-1">End Date</label>
                                                        <div className="text-sm">{formatDate(selectedUser.subscription.endDate)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-auto">
                                <Button className="w-full" asChild>
                                    <a href={`mailto:${selectedUser.userEmail}`}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Contact User
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
