import { PrivateAxios } from "@/helpers/PrivateAxios";
import { Task, CreateTaskInput, TaskFilters } from "@/types/task";

// Create a new task
export const createTask = async (values: CreateTaskInput): Promise<Task> => {
  try {
    const response = await PrivateAxios.post(`/tasks`, values);
    return response.data;
  } catch (error) {
    console.error("Failed to create task:", error);
    throw error;
  }
};

// Get all tasks with optional filters
export const getAllTasks = async (filters?: TaskFilters): Promise<Task[]> => {
  try {
    const params = new URLSearchParams();

    if (filters?.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.priority && filters.priority.length > 0) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters?.type && filters.type.length > 0) {
      params.append('type', filters.type.join(','));
    }
    if (filters?.assignee && filters.assignee.length > 0) {
      params.append('assignee', filters.assignee.join(','));
    }
    if (filters?.searchQuery) {
      params.append('search', filters.searchQuery);
    }
    if (filters?.dateRange) {
      params.append('start_date', filters.dateRange.start.toISOString());
      params.append('end_date', filters.dateRange.end.toISOString());
    }

    const response = await PrivateAxios.get(`/tasks?${params.toString()}`);
    console.log("response ================ ", response);
    
    return response.data;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    throw error;
  }
};

// Get a single task by ID
export const getTaskById = async (id: string): Promise<Task> => {
  try {
    const response = await PrivateAxios.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch task ${id}:`, error);
    throw error;
  }
};

// Update a task
export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  try {
    // Only send allowed fields to avoid 400/500 errors from backend validation
    const allowedFields = ['title', 'description', 'status', 'priority', 'type', 'dueDate', 'estimatedHours', 'tags', 'assignee'];
    const filteredUpdates: Record<string, any> = {};
    
    allowedFields.forEach((field) => {
      if (field in updates) {
        filteredUpdates[field] = (updates as any)[field];
      }
    });

    const response = await PrivateAxios.put(`/tasks/${id}`, filteredUpdates);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update task ${id}:`, error?.response?.data || error?.message || error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
  try {
    await PrivateAxios.delete(`/tasks/${id}`);
  } catch (error) {
    console.error(`Failed to delete task ${id}:`, error);
    throw error;
  }
};

// Add a comment to a task
export const addComment = async (taskId: string, content: string): Promise<Task> => {
  try {
    const response = await PrivateAxios.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error(`Failed to add comment to task ${taskId}:`, error);
    throw error;
  }
};

// Delete a comment from a task
export const deleteComment = async (taskId: string, commentId: string): Promise<Task> => {
  try {
    const response = await PrivateAxios.delete(`/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete comment ${commentId} from task ${taskId}:`, error);
    throw error;
  }
};

// Upload an attachment to a task
export const uploadAttachment = async (taskId: string, file: File): Promise<Task> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await PrivateAxios.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to upload attachment to task ${taskId}:`, error);
    throw error;
  }
};

// Delete an attachment from a task
export const deleteAttachment = async (taskId: string, attachmentId: string): Promise<Task> => {
  try {
    const response = await PrivateAxios.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete attachment ${attachmentId} from task ${taskId}:`, error);
    throw error;
  }
};
