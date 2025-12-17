"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/taskStore";
import { CreateTaskInput, TaskStatus, TaskPriority, TaskType, IUser } from "@/types/task";
import { mockUsers } from "@/data/mockUsers";
import { getUsersForTasks } from "@/services/spaces/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateTaskFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CreateTaskForm({ onSuccess, onCancel }: CreateTaskFormProps) {
    const { addTask } = useTaskStore();
    const [users, setUsers] = useState<IUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [currentUser, setCurrentUser] = useState<IUser | null>(null);

    const [formData, setFormData] = useState<Partial<CreateTaskInput>>({
        title: "",
        description: "",
        status: "backlog",
        priority: "medium",
        type: "task",
        reporter: undefined, // Will be set once users are loaded
        tags: [],
    });

    const [dueDate, setDueDate] = useState<Date>();
    const [tagInput, setTagInput] = useState("");

    // Fetch users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const fetchedUsers = await getUsersForTasks();
                setUsers(fetchedUsers);
                // Set the first user as the default reporter
                if (fetchedUsers.length > 0) {
                    setCurrentUser(fetchedUsers[0]);
                    setFormData(prev => ({
                        ...prev,
                        reporter: fetchedUsers[0]
                    }));
                }
            } catch (error) {
                console.error("Failed to load users:", error);
                // Fallback to mockUsers
                setUsers(mockUsers);
                if (mockUsers.length > 0) {
                    setCurrentUser(mockUsers[0]);
                    setFormData(prev => ({
                        ...prev,
                        reporter: mockUsers[0]
                    }));
                }
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title?.trim()) {
            alert("Please enter a task title");
            return;
        }

        if (!formData.reporter) {
            alert("Reporter information is missing");
            return;
        }

        const newTask: CreateTaskInput = {
            title: formData.title,
            description: formData.description || "",
            status: formData.status || "backlog",
            priority: formData.priority || "medium",
            type: formData.type || "task",
            assignee: formData.assignee,
            reporter: formData.reporter,
            dueDate: dueDate,
            tags: formData.tags || [],
        };

        addTask(newTask);
        onSuccess?.();
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()],
            });
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter((t) => t !== tag),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title"
                    required
                />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter task description"
                    rows={4}
                />
            </div>

            {/* Status, Priority, Type */}
            <div className="grid grid-cols-3 gap-3 w-full">
                <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}

                    >
                        <SelectTrigger id="status" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="backlog">Backlog</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                    >
                        <SelectTrigger id="priority" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as TaskType })}
                    >
                        <SelectTrigger id="type" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="task">Task</SelectItem>
                            <SelectItem value="bug">Bug</SelectItem>
                            <SelectItem value="feature">Feature</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Assignee */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                    value={formData.assignee?.id || "unassigned"}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            assignee: value === "unassigned" ? undefined : users.find((u) => u.id === value),
                        })
                    }
                    disabled={loadingUsers}
                >
                    <SelectTrigger id="assignee">
                        <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select assignee"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Reporter (Read-only) */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="reporter">Reporter</Label>
                <div className="p-2 rounded-md bg-muted/30 text-sm">
                    {formData.reporter ? formData.reporter.name : "Loading..."}
                </div>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-2">
                <Label>Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dueDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                    <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                    </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground flex items-center gap-1"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-foreground"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit">Create Task</Button>
            </div>
        </form>
    );
}
