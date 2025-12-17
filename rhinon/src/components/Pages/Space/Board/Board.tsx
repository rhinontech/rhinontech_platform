"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, Plus, Search, Filter as FilterIcon } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTaskStore } from "@/store/taskStore";
import { TaskDrawer } from "@/components/Pages/Space/Tasks/TaskDrawer";
import { FilterPanel } from "@/components/Pages/Space/Tasks/FilterPanel";
import { KanbanColumn } from "@/components/Pages/Space/Tasks/KanbanColumn";
import { KanbanTaskCard } from "@/components/Pages/Space/Tasks/KanbanTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Task, TaskStatus } from "@/types/task";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/Pages/Space/Tasks/TaskCard";
import { cn } from "@/lib/utils";

export default function Board() {
    const { toggleSpaceSidebar } = useSidebar();
    const { tasks, openDrawer, updateTask, filters, setFilters, clearFilters, setTasks, fetchTasks, isLoading } =
        useTaskStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // Fetch tasks on mount
    useEffect(() => {
        console.log("BoardPage mounted, fetching tasks...");
        fetchTasks();
    }, [fetchTasks]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Apply filters
    const getFilteredTasks = () => {
        // First, filter out any undefined or null tasks
        let filtered = [...tasks].filter((task): task is Task => {
            if (!task || !task.id || !task.status) {
                console.warn("Invalid task found:", task);
                return false;
            }
            return true;
        });

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.id.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter((task) => filters.status!.includes(task.status));
        }

        // Priority filter
        if (filters.priority && filters.priority.length > 0) {
            filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
        }

        // Type filter
        if (filters.type && filters.type.length > 0) {
            filtered = filtered.filter((task) => filters.type!.includes(task.type));
        }

        // Assignee filter
        if (filters.assignee && filters.assignee.length > 0) {
            filtered = filtered.filter((task) =>
                task.assignee ? filters.assignee!.includes(task.assignee.id) : false
            );
        }

        return filtered;
    };

    const filteredTasks = getFilteredTasks();

    // Group tasks by status
    const statuses: TaskStatus[] = ["backlog", "todo", "in-progress", "review", "done"];
    const tasksByStatus: Record<TaskStatus, Task[]> = {
        backlog: [],
        todo: [],
        "in-progress": [],
        review: [],
        done: [],
    };

    filteredTasks.forEach((task) => {
        tasksByStatus[task.status].push(task);
    });

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task || null);
    };

    // Handle drag over (for visual feedback)
    const handleDragOver = (event: DragOverEvent) => {
        // This enables dropping on columns
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;
        const activeTask = tasks.find((t) => t.id === taskId);

        if (!activeTask) return;

        // Check if dropped on a column (droppable area)
        if (statuses.includes(overId as TaskStatus)) {
            const newStatus = overId as TaskStatus;
            if (activeTask.status !== newStatus) {
                updateTask(taskId, { status: newStatus });
            }
        }
        // Check if dropped on another task
        else {
            const overTask = tasks.find((t) => t.id === overId);

            if (overTask) {
                // If different columns, change status to the target column
                if (activeTask.status !== overTask.status) {
                    updateTask(taskId, { status: overTask.status });
                }
                // If same column, reorder
                else {
                    const oldIndex = tasks.findIndex((t) => t.id === taskId);
                    const newIndex = tasks.findIndex((t) => t.id === overId);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        const newTasks = [...tasks];
                        const [removed] = newTasks.splice(oldIndex, 1);
                        newTasks.splice(newIndex, 0, removed);
                        setTasks(newTasks);
                    }
                }
            }
        }
    };

    const hasActiveFilters = Object.keys(filters).some((key) => {
        const value = filters[key as keyof typeof filters];
        return Array.isArray(value) ? value.length > 0 : !!value;
    });

    return (
        <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
            {/* Filter Panel */}
            <FilterPanel
                filters={filters}
                onFiltersChange={(newFilters) => setFilters(newFilters)}
                onClearFilters={clearFilters}
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />

            <div className="flex flex-1 flex-col w-full min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b h-[60px] px-4">
                    <div className="flex items-center gap-4">
                        <PanelLeft onClick={toggleSpaceSidebar} className="h-4 w-4 cursor-pointer" />
                        <h2 className="text-base font-bold">Board</h2>
                        <span className="text-sm text-muted-foreground">{filteredTasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openDrawer()}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
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
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-auto min-h-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                <p className="text-muted-foreground">Loading tasks...</p>
                            </div>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex gap-4 p-4 min-h-full">
                                {statuses.map((status) => (
                                    <KanbanColumn
                                        key={status}
                                        status={status}
                                        tasks={tasksByStatus[status]}
                                        onAddTask={() => {
                                            // Open drawer with pre-filled status
                                            openDrawer();
                                        }}
                                    >
                                        <SortableContext
                                            items={tasksByStatus[status].map((t) => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {tasksByStatus[status].map((task) => (
                                                <KanbanTaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onClick={() => openDrawer(task.id)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </KanbanColumn>
                                ))}
                            </div>

                            {/* Drag Overlay */}
                            <DragOverlay>
                                {activeTask ? <TaskCard task={activeTask} className="rotate-3 shadow-xl" /> : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Task Drawer */}
            <TaskDrawer />
        </div>
    );
}
