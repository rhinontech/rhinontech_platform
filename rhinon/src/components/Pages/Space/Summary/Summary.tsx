"use client";

import {
    PanelLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    Calendar,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTaskStore } from "@/store/taskStore";
import { TaskDrawer } from "@/components/Pages/Space/Tasks/TaskDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo } from "react";
import {
    StatusBadge,
    PriorityBadge,
    TypeBadge,
} from "@/components/Pages/Space/Tasks/TaskBadges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Summary() {
    const { toggleSpaceSidebar } = useSidebar();

    const { tasks, openDrawer, fetchTasks } = useTaskStore();

    // Calculate statistics
    const stats = useMemo(() => {
        const total = tasks.length;
        const byStatus = {
            backlog: tasks.filter((t) => t.status === "backlog").length,
            todo: tasks.filter((t) => t.status === "todo").length,
            inProgress: tasks.filter((t) => t.status === "in-progress").length,
            review: tasks.filter((t) => t.status === "review").length,
            done: tasks.filter((t) => t.status === "done").length,
        };
        const byPriority = {
            urgent: tasks.filter((t) => t.priority === "urgent").length,
            high: tasks.filter((t) => t.priority === "high").length,
            medium: tasks.filter((t) => t.priority === "medium").length,
            low: tasks.filter((t) => t.priority === "low").length,
        };
        const byType = {
            feature: tasks.filter((t) => t.type === "feature").length,
            bug: tasks.filter((t) => t.type === "bug").length,
            improvement: tasks.filter((t) => t.type === "improvement").length,
            task: tasks.filter((t) => t.type === "task").length,
        };

        const overdue = tasks.filter(
            (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done"
        ).length;

        const completionRate =
            total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

        // Team members with task counts
        const assigneeCounts = tasks.reduce((acc, task) => {
            if (task.assignee) {
                acc[task.assignee.id] = (acc[task.assignee.id] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const topAssignees = Object.entries(assigneeCounts)
            .map(([id, count]) => {
                const task = tasks.find((t) => t.assignee?.id === id);
                return { assignee: task?.assignee, count };
            })
            .filter((a) => a.assignee)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            total,
            byStatus,
            byPriority,
            byType,
            overdue,
            completionRate,
            topAssignees,
        };
    }, [tasks]);

    // Recent tasks (last 5 updated)
    const recentTasks = useMemo(() => {
        return [...tasks]
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
    }, [tasks]);

    // Fetch tasks on mount
    useEffect(() => {
        console.log("CalendarPage mounted, fetching tasks...");
        fetchTasks();
    }, [fetchTasks]);
    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            <div className="flex flex-1 flex-col w-full min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b h-[60px] px-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <PanelLeft
                            onClick={toggleSpaceSidebar}
                            className="h-4 w-4 cursor-pointer"
                        />
                        <h2 className="text-base font-bold">Summary</h2>
                    </div>
                </div>

                {/* Dashboard Content */}
                <ScrollArea className="flex-1 h-0">
                    <div className="flex-1 p-6">
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Overview Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Total Tasks */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Total Tasks
                                        </CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.total}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Across all statuses
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* In Progress */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            In Progress
                                        </CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stats.byStatus.inProgress}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Currently being worked on
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Overdue */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-500">
                                            {stats.overdue}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Past due date</p>
                                    </CardContent>
                                </Card>

                                {/* Completion Rate */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            Completion Rate
                                        </CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stats.completionRate}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {stats.byStatus.done} of {stats.total} tasks
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Status & Priority Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Status Breakdown */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Status Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status="backlog" />
                                                    <span className="text-sm">Backlog</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byStatus.backlog}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gray-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byStatus.backlog / stats.total) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status="todo" />
                                                    <span className="text-sm">To Do</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byStatus.todo}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byStatus.todo / stats.total) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status="in-progress" />
                                                    <span className="text-sm">In Progress</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byStatus.inProgress}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-yellow-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byStatus.inProgress / stats.total) *
                                                                    100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status="review" />
                                                    <span className="text-sm">Review</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byStatus.review}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byStatus.review / stats.total) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status="done" />
                                                    <span className="text-sm">Done</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byStatus.done}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byStatus.done / stats.total) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Priority Breakdown */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Priority Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <PriorityBadge priority="urgent" />
                                                    <span className="text-sm">Urgent</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byPriority.urgent}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-red-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byPriority.urgent / stats.total) *
                                                                    100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <PriorityBadge priority="high" />
                                                    <span className="text-sm">High</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byPriority.high}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-orange-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byPriority.high / stats.total) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <PriorityBadge priority="medium" />
                                                    <span className="text-sm">Medium</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byPriority.medium}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byPriority.medium / stats.total) *
                                                                    100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <PriorityBadge priority="low" />
                                                    <span className="text-sm">Low</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {stats.byPriority.low}
                                                    </span>
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gray-500"
                                                            style={{
                                                                width: `${stats.total > 0
                                                                    ? (stats.byPriority.low / stats.total) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Team & Recent Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Contributors */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Top Contributors
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {stats.topAssignees.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    No assignees yet
                                                </p>
                                            ) : (
                                                stats.topAssignees.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs">
                                                                    {item.assignee?.name?.charAt(0) || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm font-medium">
                                                                {item.assignee!.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {item.count} tasks
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Activity */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {recentTasks.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    No recent tasks
                                                </p>
                                            ) : (
                                                recentTasks.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className="flex items-start gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                                                        onClick={() => openDrawer(task.id)}
                                                    >
                                                        <TypeBadge type={task.type} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {task.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {task.id}
                                                                </span>
                                                                <StatusBadge status={task.status} />
                                                                {task.updatedAt && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(task.updatedAt, "MMM d, h:mm a")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Task Drawer */}
            <TaskDrawer />
        </div>
    );
}
