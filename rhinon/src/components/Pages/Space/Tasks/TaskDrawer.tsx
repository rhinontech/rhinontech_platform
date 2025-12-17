"use client";

import { useTaskStore } from "@/store/taskStore";
import { Task, TaskStatus, TaskPriority, TaskType } from "@/types/task";
import { X, Calendar as CalendarIcon, Clock, Tag, Paperclip, MessageSquare, Activity, Plus, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge, TypeBadge } from "./TaskBadges";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreateTaskForm } from "./CreateTaskForm";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { getUsersForTasks } from "@/services/spaces/userService";
import { IUser } from "@/types/task";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function TaskDrawer() {
    const { isDrawerOpen, selectedTaskId, closeDrawer, getTaskById, updateTask, deleteTask } =
        useTaskStore();
    const task = selectedTaskId ? getTaskById(selectedTaskId) : null;
    const isCreateMode = isDrawerOpen && !selectedTaskId;

    // Inline editing states
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [descriptionValue, setDescriptionValue] = useState("");

    // Users state
    const [users, setUsers] = useState<IUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

    const getUserDisplayName = (u?: { name?: string; email?: string; id?: string | number }) => {
        if (!u) return "";
        return (u.name ?? u.email ?? String(u.id ?? "")).toString();
    };

    const getInitial = (u?: { name?: string; email?: string; id?: string | number }) => {
        const display = getUserDisplayName(u);
        return display ? display.charAt(0).toUpperCase() : "";
    };

    // Defensive defaults when backend returns minimal/partial task objects
    const tags = task?.tags ?? [];
    const subtasks = task?.subtasks ?? [];
    const attachments = task?.attachments ?? [];
    const comments = task?.comments ?? [];

    // Fetch users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const fetchedUsers = await getUsersForTasks();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to load users:", error);
                // Fallback to empty array or show error
            } finally {
                setLoadingUsers(false);
            }
        };
        if (isDrawerOpen) {
            fetchUsers();
        }
    }, [isDrawerOpen]);


    // Update local state when task changes
    useEffect(() => {
        if (task) {
            setTitleValue(task.title);
            setDescriptionValue(task.description);
        }
    }, [task]);

    // Auto-focus when entering edit mode
    useEffect(() => {
        if (editingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [editingTitle]);

    useEffect(() => {
        if (editingDescription && descriptionInputRef.current) {
            descriptionInputRef.current.focus();
        }
    }, [editingDescription]);

    const handleDelete = () => {
        if (selectedTaskId) {
            setOpenDeleteConfirm(true);
        }


    };

    const handleStatusChange = (status: TaskStatus) => {
        if (selectedTaskId) {
            updateTask(selectedTaskId, { status });
        }
    };

    const handlePriorityChange = (priority: TaskPriority) => {
        if (selectedTaskId) {
            updateTask(selectedTaskId, { priority });
        }
    };

    const handleTypeChange = (type: TaskType) => {
        if (selectedTaskId) {
            updateTask(selectedTaskId, { type });
        }
    };

    const handleTitleSave = () => {
        if (selectedTaskId && titleValue.trim() && titleValue !== task?.title) {
            updateTask(selectedTaskId, { title: titleValue.trim() });
        }
        setEditingTitle(false);
    };

    const handleDescriptionSave = () => {
        if (selectedTaskId && descriptionValue !== task?.description) {
            updateTask(selectedTaskId, { description: descriptionValue });
        }
        setEditingDescription(false);
    };

    const handleAssigneeChange = (userId: string) => {
        if (selectedTaskId) {
            const user = users.find(u => u.id === userId);
            updateTask(selectedTaskId, { assignee: user });
        }
    };

    const handleDueDateChange = (date: Date | undefined) => {
        if (selectedTaskId) {
            updateTask(selectedTaskId, { dueDate: date });
        }
    };

    const handleEstimatedHoursChange = (hours: string) => {
        if (selectedTaskId) {
            const value = hours === "" ? undefined : parseFloat(hours);
            if (value === undefined || !isNaN(value)) {
                updateTask(selectedTaskId, { estimatedHours: value });
            }
        }
    };

    const handleAddTag = (tag: string) => {
        if (selectedTaskId && task && tag.trim() && !task.tags.includes(tag.trim())) {
            updateTask(selectedTaskId, { tags: [...task.tags, tag.trim()] });
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (selectedTaskId && task) {
            updateTask(selectedTaskId, { tags: task.tags.filter(t => t !== tagToRemove) });
        }
    };

    if (!isDrawerOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                onClick={closeDrawer}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-screen w-full md:w-[700px] bg-background shadow-2xl z-50 flex flex-col border-l">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        {task && <TypeBadge type={task.type} />}
                        <span className="text-sm font-mono text-muted-foreground">
                            {task?.id || "New Task"}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={closeDrawer}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                {isCreateMode ? (
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <CreateTaskForm />
                        </div>
                    </ScrollArea>
                ) : task ? (
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            <div className="p-6 space-y-6">
                                {/* Type, Status and Priority */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Type</Label>
                                        <Select value={task.type} onValueChange={handleTypeChange}>
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="task">Task</SelectItem>
                                                <SelectItem value="bug">Bug</SelectItem>
                                                <SelectItem value="feature">Feature</SelectItem>
                                                <SelectItem value="epic">Epic</SelectItem>
                                                <SelectItem value="improvement">Improvement</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                                        <Select value={task.status} onValueChange={handleStatusChange}>
                                            <SelectTrigger className="h-9 w-full">
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
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">Priority</Label>
                                        <Select value={task.priority} onValueChange={handlePriorityChange}>
                                            <SelectTrigger className="h-9 w-full">
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
                                </div>

                                {/* Title - Inline Editable */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Title</Label>
                                    {editingTitle ? (
                                        <Input
                                            ref={titleInputRef}
                                            value={titleValue}
                                            onChange={(e) => setTitleValue(e.target.value)}
                                            onBlur={handleTitleSave}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleTitleSave();
                                                if (e.key === "Escape") {
                                                    setTitleValue(task.title);
                                                    setEditingTitle(false);
                                                }
                                            }}
                                            className="text-xl font-semibold h-auto py-2"
                                        />
                                    ) : (
                                        <h2
                                            className="text-xl font-semibold cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                                            onClick={() => setEditingTitle(true)}
                                        >
                                            {task.title}
                                        </h2>
                                    )}
                                </div>

                                {/* Description - Inline Editable */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block">Description</Label>
                                    {editingDescription ? (
                                        <Textarea
                                            ref={descriptionInputRef}
                                            value={descriptionValue}
                                            onChange={(e) => setDescriptionValue(e.target.value)}
                                            onBlur={handleDescriptionSave}
                                            className="min-h-[100px] resize-none"
                                            placeholder="Add a description..."
                                        />
                                    ) : (
                                        <p
                                            className="text-sm text-muted-foreground whitespace-pre-wrap cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors min-h-[60px]"
                                            onClick={() => setEditingDescription(true)}
                                        >
                                            {task.description || "Click to add description..."}
                                        </p>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Assignee */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" />
                                            Assignee
                                        </Label>
                                        <Select value={task.assignee?.id || "unassigned"} onValueChange={handleAssigneeChange}>
                                            <SelectTrigger className="h-9 w-full">
                                                <SelectValue>
                                                    {task.assignee ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarFallback className="text-[10px]">
                                                                    {getInitial(task.assignee)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm">{getUserDisplayName(task.assignee)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Unassigned</span>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {loadingUsers ? (
                                                    <SelectItem value="loading" disabled>Loading users...</SelectItem>
                                                ) : (
                                                    users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-5 w-5">
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {getInitial(user)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>{getUserDisplayName(user)}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Reporter */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" />
                                            Reporter
                                        </Label>
                                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                    {getInitial(task.reporter)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{getUserDisplayName(task.reporter)}</span>
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            Due Date
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {task.dueDate ? format(task.dueDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={task.dueDate}
                                                    onSelect={handleDueDateChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Estimated Hours */}
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Estimated Hours
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                placeholder="0"
                                                value={task.estimatedHours || ""}
                                                onChange={(e) => handleEstimatedHoursChange(e.target.value)}
                                                className="h-9"
                                            />
                                            <span className="text-sm text-muted-foreground">hours</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                                        <Tag className="h-3 w-3" />
                                        Tags
                                    </Label>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2 p-2 rounded-md bg-muted/30 min-h-[40px]">
                                            {tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="group text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                                                >
                                                    {tag}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRemoveTag(tag)}
                                                    />
                                                </span>
                                            ))}
                                            {tags.length === 0 && (
                                                <span className="text-sm text-muted-foreground">No tags yet</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add a tag..."
                                                className="h-8 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleAddTag(e.currentTarget.value);
                                                        e.currentTarget.value = "";
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Subtasks */}
                                {subtasks.length > 0 && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                            Subtasks ({subtasks.filter((st) => st.status === "done").length}/
                                            {subtasks.length})
                                        </Label>
                                        <div className="space-y-2">
                                            {subtasks.map((subtask) => (
                                                <div
                                                    key={subtask.id}
                                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={subtask.status === "done"}
                                                        className="rounded"
                                                        readOnly
                                                    />
                                                    <span className="text-sm flex-1">{subtask.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                                        <Paperclip className="h-3 w-3" />
                                        Attachments
                                    </Label>
                                    {attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {attachments.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm flex-1">{attachment.fileName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {(attachment.fileSize / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-2 rounded-md bg-muted/30 text-sm text-muted-foreground">
                                            No attachments
                                        </div>
                                    )}
                                </div>

                                {/* Comments */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                                        <MessageSquare className="h-3 w-3" />
                                        Comments ({comments.length})
                                    </Label>
                                    {comments.length > 0 ? (
                                        <div className="space-y-3">
                                            {comments.map((comment) => (
                                                <div key={comment.id} className="p-3 rounded-md bg-muted/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="text-[10px]">
                                                                {getInitial(comment.author)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium">{getUserDisplayName(comment.author)}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(comment.createdAt, "PPp")}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{comment.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-2 rounded-md bg-muted/30 text-sm text-muted-foreground">
                                            No comments yet
                                        </div>
                                    )}
                                </div>

                                {/* Activity Log */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                                        <Activity className="h-3 w-3" />
                                        Activity
                                    </Label>
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground p-2 rounded-md bg-muted/30">
                                            Created {format(task.createdAt, "PPp")} by {getUserDisplayName(task.reporter)}
                                        </div>
                                        <div className="text-xs text-muted-foreground p-2 rounded-md bg-muted/30">
                                            Last updated {format(task.updatedAt, "PPp")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground">No task selected</p>
                    </div>
                )}

                {/* Footer */}
                {task && (
                    <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            Delete Task
                        </Button>
                        <Button variant="outline" size="sm" onClick={closeDrawer}>
                            Close
                        </Button>
                    </div>
                )}
            </div>


            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
                <DialogContent className="z-1000 max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setOpenDeleteConfirm(false)}>
                            No
                        </Button>
                        <Button variant="destructive"
                            onClick={() => {
                                if (selectedTaskId) {
                                    deleteTask(selectedTaskId);
                                    closeDrawer();
                                    setOpenDeleteConfirm(false);
                                }
                            }}
                        >
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
