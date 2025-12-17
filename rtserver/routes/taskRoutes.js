const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { uploadConversationFile } = require("../controllers/awsController"); // Reuse existing upload middleware
const {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    uploadAttachment,
    deleteAttachment,
} = require("../controllers/taskController");

router.post("/", verifyToken, createTask);
router.get("/", verifyToken, getAllTasks);
router.get("/:id", verifyToken, getTaskById);
router.put("/:id", verifyToken, updateTask);
router.delete("/:id", verifyToken, deleteTask);

// Comments
router.post("/:id/comments", verifyToken, addComment);
router.delete("/:id/comments/:commentId", verifyToken, deleteComment);

// Attachments
router.post(
    "/:id/attachments",
    verifyToken,
    uploadConversationFile, // Reuse middleware
    uploadAttachment
);
router.delete("/:id/attachments/:attachmentId", verifyToken, deleteAttachment);

module.exports = router;
