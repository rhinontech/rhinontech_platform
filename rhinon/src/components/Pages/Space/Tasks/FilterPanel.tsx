import { TaskFilters, TaskStatus, TaskPriority, TaskType, IUser } from "@/types/task";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUsersForTasks } from "@/services/spaces/userService";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
    filters: TaskFilters;
    onFiltersChange: (filters: Partial<TaskFilters>) => void;
    onClearFilters: () => void;
    isOpen: boolean;
    onToggle: () => void;
}

export function FilterPanel({
    filters,
    onFiltersChange,
    onClearFilters,
    isOpen,
    onToggle,
}: FilterPanelProps) {
    const [users, setUsers] = useState<IUser[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await getUsersForTasks();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch users for filter:", error);
            }
        };
        fetchUsers();
    }, []);

    const hasActiveFilters = Object.keys(filters).some((key) => {
        const value = filters[key as keyof TaskFilters];
        return Array.isArray(value) ? value.length > 0 : !!value;
    });

    const toggleArrayFilter = <T extends string>(
        key: keyof TaskFilters,
        value: T
    ) => {
        const currentValues = (filters[key] as T[]) || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value];
        onFiltersChange({ [key]: newValues.length > 0 ? newValues : undefined });
    };

    return (
        <div
            className={cn(
                "border-r bg-muted/30 transition-all duration-300",
                isOpen ? "w-[280px]" : "w-0 overflow-hidden"
            )}
        >
            {isOpen && (
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <h3 className="font-semibold text-sm">Filters</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearFilters}
                                    className="h-7 text-xs"
                                >
                                    Clear
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Status Filter */}
                            <div>
                                <Label className="text-xs font-semibold mb-3 block">Status</Label>
                                <div className="space-y-2">
                                    {(["backlog", "todo", "in-progress", "review", "done"] as TaskStatus[]).map(
                                        (status) => (
                                            <div key={status} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`status-${status}`}
                                                    checked={filters.status?.includes(status) || false}
                                                    onCheckedChange={() => toggleArrayFilter("status", status)}
                                                />
                                                <label
                                                    htmlFor={`status-${status}`}
                                                    className="text-sm cursor-pointer capitalize"
                                                >
                                                    {status.replace("-", " ")}
                                                </label>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <Label className="text-xs font-semibold mb-3 block">Priority</Label>
                                <div className="space-y-2">
                                    {(["urgent", "high", "medium", "low"] as TaskPriority[]).map((priority) => (
                                        <div key={priority} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`priority-${priority}`}
                                                checked={filters.priority?.includes(priority) || false}
                                                onCheckedChange={() => toggleArrayFilter("priority", priority)}
                                            />
                                            <label
                                                htmlFor={`priority-${priority}`}
                                                className="text-sm cursor-pointer capitalize"
                                            >
                                                {priority}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div>
                                <Label className="text-xs font-semibold mb-3 block">Type</Label>
                                <div className="space-y-2">
                                    {(["epic", "feature", "task", "bug"] as TaskType[]).map((type) => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`type-${type}`}
                                                checked={filters.type?.includes(type) || false}
                                                onCheckedChange={() => toggleArrayFilter("type", type)}
                                            />
                                            <label
                                                htmlFor={`type-${type}`}
                                                className="text-sm cursor-pointer capitalize"
                                            >
                                                {type}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Assignee Filter */}
                            <div>
                                <Label className="text-xs font-semibold mb-3 block">Assignee</Label>
                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`assignee-${user.id}`}
                                                checked={filters.assignee?.includes(user.id) || false}
                                                onCheckedChange={() => toggleArrayFilter("assignee", user.id)}
                                            />
                                            <label
                                                htmlFor={`assignee-${user.id}`}
                                                className="text-sm cursor-pointer"
                                            >
                                                {user.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
