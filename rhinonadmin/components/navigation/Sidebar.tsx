'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Shield, Settings, LogOut, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { EnvSwitcher } from './EnvSwitcher';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission: string;
}

interface SidebarProps {
    role: string;
    permissions: string[];
}

export function Sidebar({ role, permissions }: SidebarProps) {
    const pathname = usePathname();

    const navItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: `/${role}/dashboard`,
            icon: LayoutDashboard,
            permission: 'view_dashboard',
        },
        {
            title: 'Organizations',
            href: `/${role}/organizations`,
            icon: Building2,
            permission: 'view_dashboard', // Superadmin has this via wildcard
        },
        {
            title: 'Users',
            href: `/${role}/users`,
            icon: Users,
            permission: 'view_users',
        },
        {
            title: 'Roles',
            href: `/${role}/roles`,
            icon: Shield,
            permission: 'view_roles',
        },
        {
            title: 'Settings',
            href: `/${role}/settings`,
            icon: Settings,
            permission: 'view_settings',
        },
    ];

    // Filter nav items based on permissions
    const filteredNavItems = navItems.filter((item) =>
        permissions.includes('*') || permissions.includes(item.permission)
    );

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <aside className="w-64 bg-neutral-900 text-white flex flex-col h-screen">
            <div className="p-6 border-b border-neutral-800">
                <h1 className="text-xl font-bold">Rhinon Tech</h1>
                <p className="text-sm text-neutral-400 capitalize mt-1">{role}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-neutral-800 text-white'
                                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Environment Switcher - Only for superadmin */}
            {role === 'superadmin' && (
                <div className="px-4 pb-4">
                    <EnvSwitcher />
                </div>
            )}

            <div className="p-4 border-t border-neutral-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors w-full"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
