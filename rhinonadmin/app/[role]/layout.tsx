'use client';

import { ReactNode, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
}

export default function RoleLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ role: string }>;
}) {
    const { role } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            setUser(data.user);

            // Verify role matches URL
            if (data.user.role !== role) {
                router.push(`/${data.user.role}/dashboard`);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="text-lg text-neutral-600 dark:text-neutral-400">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen flex">
            <Sidebar role={user.role} permissions={user.permissions} />
            <main className="flex-1 bg-neutral-50 dark:bg-neutral-950">
                {children}
            </main>
        </div>
    );
}
