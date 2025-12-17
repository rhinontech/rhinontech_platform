"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft, Plus, Search, Filter as FilterIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useTaskStore } from "@/store/taskStore";
import { TaskDrawer } from "@/components/Pages/Space/Tasks/TaskDrawer";
import { FilterPanel } from "@/components/Pages/Space/Tasks/FilterPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { Task } from "@/types/task";
import { format, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import "react-big-calendar/lib/css/react-big-calendar.css";
import dynamic from "next/dynamic";

// Dynamically import react-big-calendar with SSR disabled
const CalendarComponent = dynamic(() => import("../../../../components/Pages/Space/Calendar/CalendarView"), { ssr: false });

export default function Calendar() {
    const { toggleSpaceSidebar } = useSidebar();
    const { tasks, isLoading, openDrawer, filters, setFilters, clearFilters, fetchTasks } = useTaskStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
    const [date, setDate] = useState(new Date());

    // Fetch tasks on mount
    useEffect(() => {
        console.log("CalendarPage mounted, fetching tasks...");
        fetchTasks();
    }, [fetchTasks]);

    const hasActiveFilters = Object.keys(filters).some((key) => {
        const value = filters[key as keyof typeof filters];
        return Array.isArray(value) ? value.length > 0 : !!value;
    });

    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
    };

    const handleViewChange = (newView: "month" | "week" | "day" | "agenda") => {
        setView(newView);
    };

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
                        <h2 className="text-base font-bold">Calendar</h2>
                        <span className="text-sm text-muted-foreground">
                            {tasks.length} total tasks
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openDrawer()}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Task
                        </Button>
                    </div>
                </div>

                {/* Filters & Navigation */}
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

                    {/* Calendar Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDate(new Date())}
                        >
                            Today
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleNavigate(subMonths(date, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[120px] text-center">
                            {format(date, "MMMM yyyy")}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleNavigate(addMonths(date, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View Switcher */}
                    <div className="flex gap-1 border rounded-md p-1">
                        <Button
                            variant={view === "month" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => handleViewChange("month")}
                        >
                            Month
                        </Button>
                        <Button
                            variant={view === "week" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => handleViewChange("week")}
                        >
                            Week
                        </Button>
                        <Button
                            variant={view === "day" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => handleViewChange("day")}
                        >
                            Day
                        </Button>
                        <Button
                            variant={view === "agenda" ? "default" : "ghost"}
                            size="sm"
                            className="h-7"
                            onClick={() => handleViewChange("agenda")}
                        >
                            Agenda
                        </Button>
                    </div>
                </div>

                {/* Calendar */}
                <div className="flex-1 p-4 overflow-auto min-h-0">
                    <div className="h-full min-h-[600px] bg-background border rounded-lg">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                    <p className="text-muted-foreground">Loading tasks...</p>
                                </div>
                            </div>
                        ) : (
                            <CalendarComponent
                                tasks={tasks}
                                searchQuery={searchQuery}
                                filters={filters}
                                view={view}
                                date={date}
                                onViewChange={setView}
                                onDateChange={setDate}
                                onSelectEvent={(taskId: string) => openDrawer(taskId)}
                                onSelectSlot={() => openDrawer()}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Task Drawer */}
            <TaskDrawer />

            {/* Custom Calendar Styles */}
            <style jsx global>{`
        .custom-calendar {
          font-family: inherit;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .rbc-calendar {
          background: transparent;
        }
        .rbc-header {
          padding: 8px 4px;
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 2px solid hsl(var(--border));
        }
        .rbc-today {
          background-color: hsl(var(--accent));
        }
        .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.3);
        }
        .rbc-date-cell {
          padding: 4px;
          font-size: 0.875rem;
        }
        .rbc-event {
          background: transparent;
          border: none;
          padding: 0;
        }
        .rbc-event:focus {
          outline: none;
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border: none;
        }
        .rbc-time-slot {
          border-top: 1px solid hsl(var(--border));
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border) / 0.3);
        }
        .rbc-agenda-view {
          padding: 1rem;
        }
        .rbc-agenda-table {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
        }
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell,
        .rbc-agenda-event-cell {
          padding: 8px 12px;
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-agenda-date-cell {
          font-weight: 600;
        }
      `}</style>
        </div>
    );
}