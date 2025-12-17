import { Task } from "@/types/task";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge, TypeBadge } from "./TaskBadges";
import { Calendar, Clock, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
    className?: string;
    dragHandleProps?: any;
    variant?: "default" | "board";
}

export function TaskCard({ task, onClick, className, dragHandleProps, variant = "default" }: TaskCardProps) {
    const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== "done";

    // Helpers to safely derive display name and initials when backend returns minimal user objects
    const getUserDisplayName = (u?: { name?: string; email?: string; id?: string | number }) => {
        if (!u) return "";
        return (u.name ?? u.email ?? String(u.id ?? "")).toString();
    };

    const getInitial = (u?: { name?: string; email?: string; id?: string | number }) => {
        const display = getUserDisplayName(u);
        return display ? display.charAt(0).toUpperCase() : "";
    };

    // Defensive defaults in case backend returns undefined for arrays
    const tags = task.tags ?? [];
    const subtasks = task.subtasks ?? [];
    if (variant === "board") {
        return (
            <div
                className={cn(
                    "group relative rounded-lg border bg-card p-3 hover:bg-accent/50 transition-all flex flex-col gap-3",
                    isOverdue && "border-red-500/50",
                    className
                )}
            >
                {/* Drag Handle */}
                {dragHandleProps && (
                    <div
                        {...dragHandleProps}
                        className="absolute top-3 right-3 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <TypeBadge type={task.type} />
                        <span className="text-xs text-muted-foreground font-mono">{task.id}</span>
                    </div>
                    <div className={cn(dragHandleProps ? "mr-4" : "")}>
                        <PriorityBadge priority={task.priority} />
                    </div>
                </div>

                {/* Content */}
                <div onClick={onClick} className="cursor-pointer space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div onClick={onClick} className="cursor-pointer mt-auto pt-2 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {task.assignee && (
                            <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px]">
                                        {getInitial(task.assignee)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="max-w-[60px] truncate">{getUserDisplayName(task.assignee).split(" ")[0]}</span>
                            </div>
                        )}

                        {subtasks.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                    {subtasks.filter((st) => st.status === "done").length}/{subtasks.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {task.dueDate && (
                        <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
                            <Calendar className="h-3 w-3" />
                            <span>{format(task.dueDate, "MMM d")}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div onClick={onClick} className="cursor-pointer flex flex-wrap gap-1">
                        {tags.slice(0, 2).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[100px]"
                            >
                                {tag}
                            </span>
                        ))}
                        {tags.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                +{tags.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Default (Compact) Layout for Backlogs
    return (
        <div
            className={cn(
                "group relative rounded-lg border bg-card p-4 hover:bg-accent/50 transition-all flex gap-2",
                isOverdue && "border-red-500/50",
                className
            )}
        >
            {/* Drag Handle */}
            {dragHandleProps && (
                <div
                    {...dragHandleProps}
                    className="flex items-start pt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            )}

            {/* Card Content */}
            <div onClick={onClick} className="flex-1 cursor-pointer min-w-0 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TypeBadge type={task.type} />
                        <span className="text-xs text-muted-foreground font-mono">{task.id}</span>

                    </div>
                    <div className="flex items-center gap-2">
                        {/* Due Date */}
                        {task.dueDate && (
                            <div className={cn("flex items-center gap-1 text-sm text-muted-foreground", isOverdue && "text-red-500")}>
                                <Calendar className="h-4 w-4" />
                                <span>{format(task.dueDate, "MMM d")}</span>
                            </div>
                        )}

                        <PriorityBadge priority={task.priority} />

                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                                {/* Assignee */}
                                {task.assignee && (
                                    <div className="flex items-center gap-1.5">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-[10px]">
                                                {getInitial(task.assignee)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* <span className="text-xs">{getUserDisplayName(task.assignee).split(" ")[0]}</span> */}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex items-center justify-between gap-3">

                    {/* Title */}
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                    </h3>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                            {tags.length > 3 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    +{tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>


                {/* Description */}
                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}


                {/* Subtasks */}
                {subtasks.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                            {subtasks.filter((st) => st.status === "done").length}/{subtasks.length}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
