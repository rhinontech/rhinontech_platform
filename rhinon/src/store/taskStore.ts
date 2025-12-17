import { create } from "zustand";
import { Task, TaskFilters, GroupByOption, CreateTaskInput } from "@/types/task";
import { mockTasks } from "@/data/mockTasks";
import * as taskService from "@/services/spaces/spaceService";

interface TaskStore {
    // State
    tasks: Task[];
    selectedTaskId: string | null;
    isDrawerOpen: boolean;
    filters: TaskFilters;
    groupBy: GroupByOption;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchTasks: () => Promise<void>;
    setTasks: (tasks: Task[]) => void;
    addTask: (task: CreateTaskInput) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    // Drawer actions
    openDrawer: (taskId?: string) => void;
    closeDrawer: () => void;
    setSelectedTask: (taskId: string | null) => void;

    // Filter actions
    setFilters: (filters: Partial<TaskFilters>) => void;
    clearFilters: () => void;
    setGroupBy: (groupBy: GroupByOption) => void;

    // Computed getters
    getFilteredTasks: () => Task[];
    getTaskById: (id: string) => Task | undefined;
    getTasksByStatus: (status: Task["status"]) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
    // Initial state - start with empty array, load from API
    tasks: [], // Don't show mock data - load from API instead
    selectedTaskId: null,
    isDrawerOpen: false,
    filters: {},
    groupBy: "status",
    isLoading: false,
    error: null,

    // Fetch all tasks from backend
    fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
            console.log("Fetching tasks from API...");
            const response = await taskService.getAllTasks(get().filters);
            console.log("API response:", response);
            // Ensure we have an array and normalize IDs
            const tasks = (Array.isArray(response) ? response : []).map((task: any) => ({
                ...task,
                id: String(task.id),
                assignee: task.assignee ? { ...task.assignee, id: String(task.assignee.id) } : undefined,
                reporter: task.reporter ? { ...task.reporter, id: String(task.reporter.id) } : undefined,
            }));
            console.log("Tasks after mapping:", tasks);
            set({ tasks, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            set({ error: "Failed to load tasks", isLoading: false });
            // Keep using mock data on error - don't clear tasks
            console.log("Using mock data as fallback");
        }
    },

    // Actions
    setTasks: (tasks) => set({ tasks }),

    addTask: async (taskInput) => {
        set({ isLoading: true, error: null });
        try {
            const newTask = await taskService.createTask(taskInput);

            // Validate that newTask has required properties
            if (!newTask || !newTask.id || !newTask.status || !newTask.priority || !newTask.type) {
                console.error("Invalid task returned from API:", newTask);
                throw new Error("Invalid task data returned from API");
            }

            set((state) => ({
                tasks: [...state.tasks, newTask],
                isLoading: false,
                isDrawerOpen: false // Close drawer after creating
            }));
        } catch (error) {
            console.error("Failed to create task:", error);
            set({ error: "Failed to create task", isLoading: false });

            // Fallback to local creation if API fails
            const localTask: Task = {
                ...taskInput,
                id: taskInput.id || `TASK-${Date.now()}`,
                status: taskInput.status || "backlog",
                priority: taskInput.priority || "medium",
                type: taskInput.type || "task",
                createdAt: taskInput.createdAt || new Date(),
                updatedAt: taskInput.updatedAt || new Date(),
                attachments: taskInput.attachments || [],
                comments: taskInput.comments || [],
                subtasks: taskInput.subtasks || [],
                activities: taskInput.activities || [],
            };
            set((state) => ({ tasks: [...state.tasks, localTask], isDrawerOpen: false }));
        }
    },

    updateTask: async (id, updates) => {
        // Optimistic update
        set((state) => ({
            tasks: state.tasks.map((task) =>
                task.id === id
                    ? { ...task, ...updates, updatedAt: new Date() }
                    : task
            ),
        }));

        try {
            const updatedTask = await taskService.updateTask(id, updates);
            // Update with server response
            set((state) => ({
                tasks: state.tasks.map((task) =>
                    task.id === id ? updatedTask : task
                ),
            }));
        } catch (error) {
            console.error("Failed to update task:", error);
            set({ error: "Failed to update task" });
            // Optimistic update already applied, no rollback for now
        }
    },

    deleteTask: async (id) => {
        // Optimistic delete
        const previousTasks = get().tasks;
        set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
            isDrawerOpen: state.selectedTaskId === id ? false : state.isDrawerOpen,
        }));

        try {
            await taskService.deleteTask(id);
        } catch (error) {
            console.error("Failed to delete task:", error);
            set({ error: "Failed to delete task", tasks: previousTasks });
        }
    },

    // Drawer actions
    openDrawer: (taskId) => {
        set({ isDrawerOpen: true, selectedTaskId: taskId || null });
    },

    closeDrawer: () => {
        set({ isDrawerOpen: false, selectedTaskId: null });
    },

    setSelectedTask: (taskId) => {
        set({ selectedTaskId: taskId });
    },

    // Filter actions
    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        }));
        // Optionally refetch with new filters
        // get().fetchTasks();
    },

    clearFilters: () => {
        set({ filters: {} });
        // Optionally refetch without filters
        // get().fetchTasks();
    },

    setGroupBy: (groupBy) => {
        set({ groupBy });
    },

    // Computed getters
    getFilteredTasks: () => {
        const { tasks, filters } = get();
        let filtered = [...tasks];

        // Filter by status
        if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter((task) => filters.status!.includes(task.status));
        }

        // Filter by priority
        if (filters.priority && filters.priority.length > 0) {
            filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
        }

        // Filter by type
        if (filters.type && filters.type.length > 0) {
            filtered = filtered.filter((task) => filters.type!.includes(task.type));
        }

        // Filter by assignee
        if (filters.assignee && filters.assignee.length > 0) {
            filtered = filtered.filter((task) =>
                task.assignee ? filters.assignee!.includes(task.assignee.id) : false
            );
        }

        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter((task) =>
                filters.tags!.some((tag) => task.tags.includes(tag))
            );
        }

        // Filter by date range
        if (filters.dateRange) {
            filtered = filtered.filter((task) => {
                if (!task.dueDate) return false;
                return (
                    task.dueDate >= filters.dateRange!.start &&
                    task.dueDate <= filters.dateRange!.end
                );
            });
        }

        // Filter by search query
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.id.toLowerCase().includes(query)
            );
        }

        return filtered;
    },

    getTaskById: (id) => {
        const task = get().tasks.find((task) => task && task.id === id);
        if (!task) {
            console.warn(`Task with id ${id} not found`);
            return undefined;
        }
        return task;
    },

    getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task && task.status === status);
    },
}));
