import { TaskStatus, TaskPriority, TaskType } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: TaskStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const variants: Record<TaskStatus, { label: string; className: string }> = {
        backlog: {
            label: "Backlog",
            className: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
        },
        todo: {
            label: "To Do",
            className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        },
        "in-progress": {
            label: "In Progress",
            className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
        },
        review: {
            label: "Review",
            className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
        },
        done: {
            label: "Done",
            className: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
        },
    };

    const defaultVariant = { label: "Backlog", className: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20" };
    const variant = status ? variants[status] : defaultVariant;

    return (
        <Badge variant="outline" className={cn(variant?.className || defaultVariant.className, className)}>
            {variant?.label || defaultVariant.label}
        </Badge>
    );
}

interface PriorityBadgeProps {
    priority: TaskPriority;
    className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    const variants: Record<TaskPriority, { label: string; className: string }> = {
        low: {
            label: "Low",
            className: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
        },
        medium: {
            label: "Medium",
            className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        },
        high: {
            label: "High",
            className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
        },
        urgent: {
            label: "Urgent",
            className: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
        },
    };

    const defaultVariant = { label: "Medium", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" };
    const variant = priority ? variants[priority] : defaultVariant;

    return (
        <Badge variant="outline" className={cn(variant?.className || defaultVariant.className, className)}>
            {variant?.label || defaultVariant.label}
        </Badge>
    );
}

interface TypeBadgeProps {
    type: TaskType;
    className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
    const variants: Record<TaskType, { label: string; className: string; icon: string }> = {
        task: {
            label: "Task",
            className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
            icon: "📋",
        },
        bug: {
            label: "Bug",
            className: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
            icon: "🐛",
        },
        feature: {
            label: "Feature",
            className: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
            icon: "✨",
        },
        epic: {
            label: "Epic",
            className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
            icon: "🎯",
        },
    };

    // Defensive fallback for undefined type
    const defaultVariant = {
        label: "Task",
        className: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
        icon: "📋",
    };

    const variant = type ? variants[type] : defaultVariant;

    return (
        <Badge variant="outline" className={cn(variant?.className || defaultVariant.className, className)}>
            <span className="mr-1">{variant?.icon || defaultVariant.icon}</span>
            {variant?.label || defaultVariant.label}
        </Badge>
    );
}
