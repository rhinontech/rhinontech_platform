"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, Plus, Search, Filter as FilterIcon } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTaskStore } from "@/store/taskStore";
import { TaskCard } from "@/components/Pages/Space/Tasks/TaskCard";
import { TaskDrawer } from "@/components/Pages/Space/Tasks/TaskDrawer";
import { FilterPanel } from "@/components/Pages/Space/Tasks/FilterPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Task, GroupByOption } from "@/types/task";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// Sortable Task Card Wrapper
function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <TaskCard task={task} onClick={onClick} dragHandleProps={listeners} />
        </div>
    );
}

export default function Backlogs() {
    const { toggleSpaceSidebar } = useSidebar();
    const { tasks, openDrawer, filters, setFilters, clearFilters, groupBy, setGroupBy, setTasks, fetchTasks, isLoading } = useTaskStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Fetch tasks on mount
    useEffect(() => {
        console.log("BacklogsPage mounted, fetching tasks...");
        fetchTasks();
    }, [fetchTasks]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Apply filters
    const getFilteredTasks = () => {
        console.log("All tasks in store:", tasks);

        // First, filter out any undefined or null tasks
        let filtered = [...tasks].filter((task): task is Task => {
            if (!task || !task.id || !task.status) {
                console.warn("Invalid task found:", task);
                return false;
            }
            return true;
        });

        console.log("Tasks after validity check:", filtered);

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

    // Group tasks
    const groupedTasks: Record<string, Task[]> = {};

    if (groupBy === "status") {
        const statuses: Task["status"][] = ["backlog", "todo", "in-progress", "review", "done"];
        statuses.forEach((status) => {
            groupedTasks[status] = filteredTasks.filter((task) => task.status === status);
        });
    } else if (groupBy === "priority") {
        const priorities: Task["priority"][] = ["urgent", "high", "medium", "low"];
        priorities.forEach((priority) => {
            groupedTasks[priority] = filteredTasks.filter((task) => task.priority === priority);
        });
    } else if (groupBy === "type") {
        const types: Task["type"][] = ["epic", "feature", "task", "bug"];
        types.forEach((type) => {
            groupedTasks[type] = filteredTasks.filter((task) => task.type === type);
        });
    } else {
        groupedTasks["all"] = filteredTasks;
    }

    const getGroupLabel = (key: string): string => {
        const labels: Record<string, string> = {
            // Status
            backlog: "Backlog",
            todo: "To Do",
            "in-progress": "In Progress",
            review: "Review",
            done: "Done",
            // Priority
            urgent: "Urgent",
            high: "High",
            medium: "Medium",
            low: "Low",
            // Type
            epic: "Epic",
            feature: "Feature",
            task: "Task",
            bug: "Bug",
            // Default
            all: "All Tasks",
        };
        return labels[key] || key;
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = tasks.findIndex((task) => task.id === active.id);
        const newIndex = tasks.findIndex((task) => task.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newTasks = arrayMove(tasks, oldIndex, newIndex);
            setTasks(newTasks);
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
                        <h2 className="text-base font-bold">Backlogs</h2>
                        <span className="text-sm text-muted-foreground">
                            {filteredTasks.length} tasks
                        </span>
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
                    <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByOption)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Group by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="status">Group by Status</SelectItem>
                            <SelectItem value="priority">Group by Priority</SelectItem>
                            <SelectItem value="type">Group by Type</SelectItem>
                            <SelectItem value="none">No Grouping</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Task List */}
                <ScrollArea className="flex-1 h-0 p-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                    <p className="text-muted-foreground">Loading tasks...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => {
                                    if (groupTasks.length === 0) return null;

                                    return (
                                        <div key={groupKey}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    {getGroupLabel(groupKey)}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {groupTasks.length} tasks
                                                </span>
                                            </div>
                                            <SortableContext
                                                items={groupTasks.map((t) => t.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="space-y-2">
                                                    {groupTasks.map((task) => (
                                                        <SortableTaskCard
                                                            key={task.id}
                                                            task={task}
                                                            onClick={() => openDrawer(task.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </div>
                                    );
                                })}

                                {filteredTasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-muted-foreground mb-2">No tasks found</p>
                                        <p className="text-sm text-muted-foreground">
                                            {searchQuery || hasActiveFilters
                                                ? "Try adjusting your search or filters"
                                                : "Create your first task to get started"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DndContext>
                </ScrollArea>
            </div>

            {/* Task Drawer */}
            <TaskDrawer />
        </div>
    );
}
