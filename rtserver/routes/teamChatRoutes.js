const express = require("express");
const router = express.Router();
const teamChatController = require("../controllers/teamChatController");
const verifyToken = require("../middleware/verifyToken");

// All routes require authentication

// Channel routes
router.get("/channels", verifyToken, teamChatController.getChannels);
router.post("/channels", verifyToken, teamChatController.createChannel);
router.get("/channels/:channelId/members", verifyToken, teamChatController.getChannelMembers);

// User routes
router.get("/users", verifyToken, teamChatController.getUsers);

// Message routes
router.get("/messages", verifyToken, teamChatController.getMessages);
router.post("/messages", verifyToken, teamChatController.sendMessage);

module.exports = router;
