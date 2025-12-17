// Task and Project Management Types

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'task' | 'bug' | 'feature' | 'epic' | 'improvement';

export interface IUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
}

export interface Comment {
    id: string;
    taskId: string;
    author: IUser;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Attachment {
    id: string;
    taskId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedBy: IUser;
    uploadedAt: Date;
}

export interface Activity {
    id: string;
    taskId: string;
    user: IUser;
    action: string; // e.g., "changed status", "added comment", "updated assignee"
    oldValue?: string;
    newValue?: string;
    timestamp: Date;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    assignee?: IUser;
    reporter: IUser;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    attachments: Attachment[];
    comments: Comment[];
    subtasks: Task[];
    parentTaskId?: string;
    activities: Activity[];
}

// Helper type for creating new tasks (optional fields)
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'attachments' | 'comments' | 'subtasks' | 'activities'> & {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    attachments?: Attachment[];
    comments?: Comment[];
    subtasks?: Task[];
    activities?: Activity[];
};

// Filter options
export interface TaskFilters {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    type?: TaskType[];
    assignee?: string[];
    tags?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    searchQuery?: string;
}

// Group by options
export type GroupByOption = 'status' | 'priority' | 'assignee' | 'type' | 'none';
