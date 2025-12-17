const { tasks, users, organizations } = require("../models");
const { Op } = require("sequelize");
const { nanoid } = require("nanoid"); // Ensure nanoid is installed or use a helper

// Helper to format task for response
const formatTask = (task) => {
    const plainTask = task.get({ plain: true });
    return {
        ...plainTask,
        id: plainTask.task_id, // Map task_id to id
        _id: plainTask.id, // Keep internal ID if needed, or remove
        assignee: plainTask.assignee || null,
        reporter: plainTask.reporter || null,
        dueDate: plainTask.due_date,
        estimatedHours: plainTask.estimated_hours,
        actualHours: plainTask.actual_hours,
        createdAt: plainTask.created_at,
        updatedAt: plainTask.updated_at,
        // Remove snake_case fields if desired to strictly match JSON
        task_id: undefined,
        due_date: undefined,
        estimated_hours: undefined,
        actual_hours: undefined,
        created_at: undefined,
        updated_at: undefined,
        assignee_id: undefined,
        reporter_id: undefined,
        organization_id: undefined,
    };
};

exports.createTask = async (req, res) => {
    try {
        const {
            id, // User provided ID like "TASK-1"
            title,
            description,
            status,
            priority,
            type,
            assignee, // Expecting ID or object with ID
            reporter, // Expecting ID or object with ID
            parentTaskId, // NEW: For creating subtasks
            dueDate,
            estimatedHours,
            actualHours,
            tags,
            attachments,
            comments,
            activities,
        } = req.body;

        const organization_id = req.user.organization_id;

        // Handle assignee and reporter IDs
        const assignee_id = assignee?.id || assignee;
        const reporter_id = reporter?.id || reporter || req.user.id;

        // Generate auto-incrementing task_id if not provided
        let task_id = id;
        if (!task_id) {
            const taskCount = await tasks.count({ where: { organization_id } });
            task_id = `TASK-${taskCount + 1}`;
        }

        const newTask = await tasks.create({
            task_id,
            organization_id,
            title,
            description,
            status,
            priority,
            type,
            assignee_id,
            reporter_id,
            parent_task_id: parentTaskId,
            due_date: dueDate,
            estimated_hours: estimatedHours,
            actual_hours: actualHours,
            tags,
            attachments,
            comments,
            activities,
        });

        // Fetch the created task with associations to return full object
        const createdTask = await tasks.findOne({
            where: { id: newTask.id },
            include: [
                { model: users, as: "assignee", attributes: ["id", "email", "phone_number"] }, // Add other user fields as needed
                { model: users, as: "reporter", attributes: ["id", "email", "phone_number"] },
            ],
        });

        res.status(201).json(formatTask(createdTask));
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllTasks = async (req, res) => {
    try {
        const organization_id = req.user.organization_id;
        const { status, priority, assignee, search, start_date, end_date } = req.query;

        const whereClause = { organization_id };

        // Filters
        if (status) {
            whereClause.status = { [Op.in]: status.split(",") };
        }
        if (priority) {
            whereClause.priority = { [Op.in]: priority.split(",") };
        }
        if (assignee) {
            whereClause.assignee_id = assignee;
        }
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
            ];
        }
        if (start_date && end_date) {
            whereClause.due_date = {
                [Op.between]: [new Date(start_date), new Date(end_date)],
            };
        }

        const allTasks = await tasks.findAll({
            where: whereClause,
            include: [
                { model: users, as: "assignee", attributes: ["id", "email", "phone_number"] },
                { model: users, as: "reporter", attributes: ["id", "email", "phone_number"] },
                { model: tasks, as: "subtasks" }, // Include subtasks
            ],
            order: [["created_at", "DESC"]],
        });

        const formattedTasks = allTasks.map(formatTask);
        res.status(200).json(formattedTasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const organization_id = req.user.organization_id;

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }], // Support both UUID string and internal ID
                organization_id
            },
            include: [
                { model: users, as: "assignee", attributes: ["id", "email", "phone_number"] },
                { model: users, as: "reporter", attributes: ["id", "email", "phone_number"] },
                { model: tasks, as: "subtasks" }, // Include subtasks
            ],
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json(formatTask(task));
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const organization_id = req.user.organization_id;
        const updates = req.body;

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }],
                organization_id
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Map incoming fields to DB fields
        const dbUpdates = {
            ...updates,
            due_date: updates.dueDate,
            estimated_hours: updates.estimatedHours,
            actual_hours: updates.actualHours,
            assignee_id: updates.assignee?.id || updates.assignee,
            reporter_id: updates.reporter?.id || updates.reporter,
        };

        await task.update(dbUpdates);

        // Fetch updated task with associations
        const updatedTask = await tasks.findOne({
            where: { id: task.id },
            include: [
                { model: users, as: "assignee", attributes: ["id", "email", "phone_number"] },
                { model: users, as: "reporter", attributes: ["id", "email", "phone_number"] },
            ],
        });

        res.status(200).json(formatTask(updatedTask));
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const organization_id = req.user.organization_id;

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }],
                organization_id
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        await task.destroy();
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Comments ---

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const organization_id = req.user.organization_id;
        const user_id = req.user.id;

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }],
                organization_id
            },
        });

        if (!task) return res.status(404).json({ message: "Task not found" });

        const newComment = {
            id: nanoid(),
            content,
            authorId: user_id,
            createdAt: new Date(),
        };

        const updatedComments = [...(task.comments || []), newComment];
        await task.update({ comments: updatedComments });

        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const organization_id = req.user.organization_id;

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }],
                organization_id
            },
        });

        if (!task) return res.status(404).json({ message: "Task not found" });

        const updatedComments = (task.comments || []).filter((c) => c.id !== commentId);
        await task.update({ comments: updatedComments });

        res.status(200).json({ message: "Comment deleted" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Attachments ---

exports.uploadAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const organization_id = req.user.organization_id;

        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }],
                organization_id
            },
        });

        if (!task) return res.status(404).json({ message: "Task not found" });

        const newAttachment = {
            id: nanoid(),
            fileName: req.file.originalname,
            fileKey: req.file.key,
            url: req.file.location,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date(),
        };

        const updatedAttachments = [...(task.attachments || []), newAttachment];
        await task.update({ attachments: updatedAttachments });

        res.status(201).json(newAttachment);
    } catch (error) {
        console.error("Error uploading attachment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const organization_id = req.user.organization_id;

        const task = await tasks.findOne({
            where: {
                [Op.or]: [{ task_id: id }, { id: isNaN(id) ? -1 : id }],
                organization_id
            },
        });

        if (!task) return res.status(404).json({ message: "Task not found" });

        const updatedAttachments = (task.attachments || []).filter((a) => a.id !== attachmentId);
        await task.update({ attachments: updatedAttachments });

        // Optional: Delete from S3 here if needed

        res.status(200).json({ message: "Attachment deleted" });
    } catch (error) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
