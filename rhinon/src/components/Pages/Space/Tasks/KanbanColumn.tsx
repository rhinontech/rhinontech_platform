import { Task, TaskStatus } from "@/types/task";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

interface KanbanColumnProps {
    status: TaskStatus;
    tasks: Task[];
    onAddTask: () => void;
    children: React.ReactNode;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
    backlog: {
        label: "Backlog",
        color: "bg-gray-500/10 border-gray-500/20",
    },
    todo: {
        label: "To Do",
        color: "bg-blue-500/10 border-blue-500/20",
    },
    "in-progress": {
        label: "In Progress",
        color: "bg-yellow-500/10 border-yellow-500/20",
    },
    review: {
        label: "Review",
        color: "bg-purple-500/10 border-purple-500/20",
    },
    done: {
        label: "Done",
        color: "bg-green-500/10 border-green-500/20",
    },
};

export function KanbanColumn({ status, tasks, onAddTask, children }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const config = statusConfig[status];

    return (
        <div className="flex flex-col h-full min-w-[320px] max-w-[320px]">
            {/* Column Header */}
            <div className={cn("rounded-t-lg border-t border-x p-3 flex-shrink-0", config.color)}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{config.label}</h3>
                    <span className="text-xs bg-background/50 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-xs"
                    onClick={onAddTask}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add task
                </Button>
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 border-x border-b rounded-b-lg p-2 space-y-2 bg-muted/30 transition-colors min-h-0",
                    isOver && "bg-accent/50 border-primary"
                )}
            >
                {children}
                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
