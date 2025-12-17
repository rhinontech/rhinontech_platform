"use client";

import { PanelLeft, Plus, Search, Filter as FilterIcon } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTaskStore } from "@/store/taskStore";
import { TaskDrawer } from "@/components/Pages/Space/Tasks/TaskDrawer";
import { FilterPanel } from "@/components/Pages/Space/Tasks/FilterPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useRef, useEffect } from "react";
import { Task } from "@/types/task";
import {
    format,
    addMonths,
    subMonths,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    isSameDay,
    min,
    max,
    startOfWeek,
    eachWeekOfInterval
} from "date-fns";
import { cn } from "@/lib/utils";

type ZoomLevel = "days" | "weeks" | "months";

export default function Timeline() {
    const { toggleSpaceSidebar } = useSidebar();
    const { tasks, isLoading, openDrawer, filters, setFilters, clearFilters, fetchTasks } = useTaskStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("weeks");
    const timelineRef = useRef<HTMLDivElement>(null);

    // Fetch tasks on mount
    useEffect(() => {
        console.log("TimelinePage mounted, fetching tasks...");
        fetchTasks();
    }, [fetchTasks]);

    // Apply filters
    const getFilteredTasks = () => {
        // First filter out invalid tasks
        let filtered = [...tasks].filter((task): task is Task => {
            if (!task || !task.id || !task.status || !task.dueDate) {
                return false;
            }
            return true;
        });

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.id.toLowerCase().includes(query)
            );
        }

        if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter((task) => filters.status!.includes(task.status));
        }

        if (filters.priority && filters.priority.length > 0) {
            filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
        }

        if (filters.type && filters.type.length > 0) {
            filtered = filtered.filter((task) => filters.type!.includes(task.type));
        }

        if (filters.assignee && filters.assignee.length > 0) {
            filtered = filtered.filter((task) =>
                task.assignee ? filters.assignee!.includes(task.assignee.id) : false
            );
        }

        return filtered;
    };

    const filteredTasks = getFilteredTasks();
    const tasksWithDates = filteredTasks.filter((task) => task.dueDate);

    // Calculate date range
    const dateRange = useMemo(() => {
        if (tasksWithDates.length === 0) {
            const today = new Date();
            const start = startOfMonth(subMonths(today, 3));
            const end = endOfMonth(addMonths(today, 3));
            return { start, end };
        }

        const taskDates = tasksWithDates.map((t) => t.dueDate!);
        const earliest = min(taskDates);
        const latest = max(taskDates);
        const start = startOfMonth(subMonths(earliest, 3));
        const end = endOfMonth(addMonths(latest, 3));

        return { start, end };
    }, [tasksWithDates]);

    // Generate timeline units based on zoom level
    const timelineUnits = useMemo(() => {
        const { start, end } = dateRange;

        if (zoomLevel === "days") {
            const days = eachDayOfInterval({ start, end });
            return days.map((day) => ({
                date: day,
                label: format(day, "d"),
                sublabel: format(day, "EEE"),
                width: 40,
            }));
        } else if (zoomLevel === "weeks") {
            const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
            return weeks.map((week) => ({
                date: week,
                label: format(week, "MMM d"),
                sublabel: "Week",
                width: 80,
            }));
        } else {
            // months
            const months: Date[] = [];
            let current = startOfMonth(start);
            while (current <= end) {
                months.push(current);
                current = addMonths(current, 1);
            }
            return months.map((month) => ({
                date: month,
                label: format(month, "MMM"),
                sublabel: format(month, "yyyy"),
                width: 100,
            }));
        }
    }, [dateRange, zoomLevel]);

    // Calculate task position
    const getTaskPosition = (task: Task) => {
        if (!task.dueDate) return { left: 0, width: 0 };

        let position = 0;
        let found = false;

        for (let i = 0; i < timelineUnits.length; i++) {
            const unit = timelineUnits[i];

            if (isSameDay(task.dueDate, unit.date) ||
                (task.dueDate >= unit.date && (!timelineUnits[i + 1] || task.dueDate < timelineUnits[i + 1].date))) {
                position = timelineUnits.slice(0, i).reduce((sum, u) => sum + u.width, 0);
                found = true;
                break;
            }
        }

        if (!found) return { left: 0, width: 0 };

        const width = zoomLevel === "days" ? 120 : zoomLevel === "weeks" ? 160 : 200;

        return { left: position, width };
    };

    const priorityColors = {
        urgent: "bg-red-500 border-red-600 text-white",
        high: "bg-orange-500 border-orange-600 text-white",
        medium: "bg-blue-500 border-blue-600 text-white",
        low: "bg-gray-500 border-gray-600 text-white",
    };

    const hasActiveFilters = Object.keys(filters).some((key) => {
        const value = filters[key as keyof typeof filters];
        return Array.isArray(value) ? value.length > 0 : !!value;
    });

    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);

    // Auto-scroll to first task on mount
    useEffect(() => {
        if (timelineRef.current && tasksWithDates.length > 0) {
            // Find the earliest task
            const earliestTask = tasksWithDates.reduce((earliest, task) => {
                if (!earliest.dueDate || !task.dueDate) return earliest;
                return task.dueDate < earliest.dueDate ? task : earliest;
            });

            // Get its position
            const position = getTaskPosition(earliestTask);

            // Scroll to show the task (with some padding to the left)
            if (position.left > 0) {
                timelineRef.current.scrollLeft = Math.max(0, position.left - 100);
            }
        }
    }, [zoomLevel]); // Re-scroll when zoom level changes

    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            <FilterPanel
                filters={filters}
                onFiltersChange={(newFilters) => setFilters(newFilters)}
                onClearFilters={clearFilters}
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />

            <div className="flex flex-1 flex-col w-full min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b h-[80px] px-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <PanelLeft onClick={toggleSpaceSidebar} className="h-4 w-4 cursor-pointer" />
                        <h2 className="text-base font-bold">Timeline</h2>
                        <span className="text-sm text-muted-foreground">{tasksWithDates.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openDrawer()}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>

                {/* Filters & Zoom */}
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30 flex-shrink-0">
                    <Button
                        variant={hasActiveFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={cn(hasActiveFilters && "bg-primary")}
                    >
                        <FilterIcon className="h-4 w-4 mr-2" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-2 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                                {Object.values(filters).filter((v) => Array.isArray(v) && v.length > 0).length}
                            </span>
                        )}
                    </Button>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex gap-1 border rounded-md p-1">
                        <Button
                            variant={zoomLevel === "days" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => setZoomLevel("days")}
                        >
                            Days
                        </Button>
                        <Button
                            variant={zoomLevel === "weeks" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => setZoomLevel("weeks")}
                        >
                            Weeks
                        </Button>
                        <Button
                            variant={zoomLevel === "months" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => setZoomLevel("months")}
                        >
                            Months
                        </Button>
                    </div>
                </div>

                {/* Timeline */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                            <p className="text-muted-foreground">Loading tasks...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Fixed Task Names */}
                        <div className="w-[280px] flex-shrink-0 border-r flex flex-col bg-background">
                            <div className="h-[60px] border-b bg-muted/30 flex items-center px-4 font-semibold text-sm flex-shrink-0">
                                Task
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {tasksWithDates.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                                        No tasks with due dates
                                    </div>
                                ) : (
                                    tasksWithDates.map((task) => (
                                        <div
                                            key={task.id}
                                            className="h-[80px] border-b hover:bg-accent/50 transition-colors cursor-pointer p-3 flex flex-col justify-center"
                                            onClick={() => openDrawer(task.id)}
                                        >
                                            <div className="text-xs font-mono text-muted-foreground mb-1">{task.id}</div>
                                            <div className="text-sm font-medium truncate">{task.title}</div>
                                            {task.assignee && (
                                                <div className="text-xs text-muted-foreground truncate">{task.assignee.name}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Scrollable Timeline */}
                        <div className="flex-1 overflow-auto" ref={timelineRef}>
                            <div style={{ width: `${totalWidth}px` }}>
                                {/* Timeline Header */}
                                <div className="sticky top-0 z-10 bg-background border-b h-[60px] flex">
                                    {timelineUnits.map((unit, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "border-r text-center py-2 flex flex-col justify-center text-xs flex-shrink-0",
                                                isSameDay(unit.date, new Date()) && "bg-primary/10 font-semibold"
                                            )}
                                            style={{ width: `${unit.width}px` }}
                                        >
                                            <div className="font-medium">{unit.label}</div>
                                            <div className="text-muted-foreground text-[10px]">{unit.sublabel}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Timeline Grid & Tasks */}
                                <div className="relative">
                                    {/* Vertical Grid */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {timelineUnits.map((unit, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "border-r flex-shrink-0",
                                                    isSameDay(unit.date, new Date()) && "border-primary/30"
                                                )}
                                                style={{ width: `${unit.width}px` }}
                                            />
                                        ))}
                                    </div>

                                    {/* Task Rows */}
                                    {tasksWithDates.map((task) => {
                                        const position = getTaskPosition(task);

                                        return (
                                            <div key={task.id} className="h-[80px] border-b hover:bg-accent/50 transition-colors relative">
                                                {position.left > 0 && (
                                                    <div
                                                        className={cn(
                                                            "absolute rounded border-2 cursor-pointer transition-all hover:scale-105 hover:z-10 flex items-center px-2",
                                                            priorityColors[task.priority]
                                                        )}
                                                        style={{
                                                            left: `${position.left}px`,
                                                            width: `${position.width}px`,
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            height: "32px",
                                                        }}
                                                        onClick={() => openDrawer(task.id)}
                                                    >
                                                        <span className="text-xs font-medium truncate">{task.title}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <TaskDrawer />
        </div>
    );
}
