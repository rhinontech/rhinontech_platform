"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Task, TaskFilters } from "@/types/task";
import { cn } from "@/lib/utils";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface CalendarViewProps {
  tasks: Task[];
  searchQuery: string;
  filters: TaskFilters;
  view: "month" | "week" | "day" | "agenda";
  date: Date;
  onViewChange: (view: "month" | "week" | "day" | "agenda") => void;
  onDateChange: (date: Date) => void;
  onSelectEvent: (taskId: string) => void;
  onSelectSlot: () => void;
}

function EventComponent({ event }: { event: any }) {
  const task = event.resource as Task;

  const priorityColors = {
    urgent: "bg-red-500/90 border-red-600",
    high: "bg-orange-500/90 border-orange-600",
    medium: "bg-blue-500/90 border-blue-600",
    low: "bg-gray-500/90 border-gray-600",
  };

  return (
    <div
      className={cn(
        "text-xs px-1 py-0.5 rounded border text-white truncate",
        priorityColors[task.priority] || "bg-gray-500/90 border-gray-600"
      )}
    >
      <span className="font-medium">{task.id}</span> {task.title}
    </div>
  );
}

export default function CalendarView({
  tasks,
  searchQuery,
  filters,
  view,
  date,
  onViewChange,
  onDateChange,
  onSelectEvent,
  onSelectSlot,
}: CalendarViewProps) {
  // Setup the localizer for react-big-calendar
  const localizer = useMemo(() => {
    return dateFnsLocalizer({
      format,
      parse,
      startOfWeek,
      getDay,
      locales: {
        "en-US": enUS,
      },
    });
  }, []);

  // Apply filters
  const getFilteredTasks = () => {
    // First filter out invalid tasks
    let filtered = [...tasks].filter((task): task is Task => {
      if (!task || !task.id || !task.status) {
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
      filtered = filtered.filter((task) =>
        filters.status!.includes(task.status)
      );
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((task) =>
        filters.priority!.includes(task.priority)
      );
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

  // Convert tasks to calendar events
  const events = useMemo(() => {
    return filteredTasks
      .filter((task) => task.dueDate) // Only tasks with due dates
      .map((task) => {
        // Ensure dueDate is a proper Date object
        const dueDate =
          task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate!);

        return {
          id: task.id,
          title: `${task.id}: ${task.title}`,
          start: dueDate,
          end: dueDate,
          resource: task,
        };
      });
  }, [filteredTasks]);

  // Handler to support all possible views from react-big-calendar
  const handleViewChange = (newView: string) => {
    if (["month", "week", "day", "agenda"].includes(newView)) {
      onViewChange(newView as "month" | "week" | "day" | "agenda");
    }
  };

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      view={view}
      onView={handleViewChange}
      date={date}
      onNavigate={onDateChange}
      onSelectEvent={(event) => onSelectEvent(event.id)}
      onSelectSlot={onSelectSlot}
      selectable
      toolbar={false}
      components={{
        event: EventComponent,
      }}
      style={{ height: "100%" }}
      className="custom-calendar"
    />
  );
}
