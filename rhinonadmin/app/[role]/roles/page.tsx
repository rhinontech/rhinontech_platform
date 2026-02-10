'use client';

import { useEffect, useState, use } from 'react';
import { Button } from '@/components/ui/button';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PERMISSION_CATEGORIES } from '@/lib/permissions';

interface Role {
    _id: string;
    name: string;
    displayName: string;
    permissions: string[];
    isSystemRole: boolean;
}

export default function RolesPage({ params }: { params: Promise<{ role: string }> }) {
    use(params);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        permissions: [] as string[],
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles');
            if (res.ok) {
                const data = await res.json();
                setRoles(data.roles);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                displayName: role.displayName,
                permissions: role.permissions,
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', displayName: '', permissions: [] });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingRole ? `/api/roles/${editingRole._id}` : '/api/roles';
            const method = editingRole ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setDialogOpen(false);
                fetchRoles();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save role');
            }
        } catch (error) {
            console.error('Failed to save role:', error);
            alert('An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRoles();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete role');
            }
        } catch (error) {
            console.error('Failed to delete role:', error);
        }
    };

    const togglePermission = (permission: string) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter((p) => p !== permission)
                : [...prev.permissions, permission],
        }));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Roles</h2>
                    <p className="text-neutral-500 mt-1">Manage user roles and permissions</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
                            <DialogDescription>
                                {editingRole
                                    ? 'Update role details and permissions'
                                    : 'Create a new role with specific permissions'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Role Name (slug)</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., manager"
                                    required
                                    disabled={!!editingRole}
                                />
                            </div>
                            <div>
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, displayName: e.target.value })
                                    }
                                    placeholder="e.g., Manager"
                                    required
                                />
                            </div>

                            <div>
                                <Label className="mb-3 block">Permissions</Label>
                                {PERMISSION_CATEGORIES.map((category) => (
                                    <div key={category.name} className="mb-4">
                                        <h4 className="font-medium text-sm mb-2">{category.name}</h4>
                                        <div className="space-y-2 pl-4">
                                            {category.permissions.map((perm) => (
                                                <label
                                                    key={perm.key}
                                                    className="flex items-start gap-2 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(perm.key)}
                                                        onChange={() => togglePermission(perm.key)}
                                                        className="mt-1"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-sm">{perm.displayName}</div>
                                                        <div className="text-xs text-neutral-500">
                                                            {perm.description}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button type="submit" className="w-full">
                                {editingRole ? 'Update Role' : 'Create Role'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role._id}>
                                        <TableCell className="font-mono">{role.name}</TableCell>
                                        <TableCell>{role.displayName}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-neutral-500">
                                                {role.permissions.includes('*')
                                                    ? 'All permissions'
                                                    : `${role.permissions.length} permissions`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {role.isSystemRole ? (
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                                    System
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded text-xs">
                                                    Custom
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(role)}
                                                    disabled={role.isSystemRole}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(role._id)}
                                                    disabled={role.isSystemRole}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
