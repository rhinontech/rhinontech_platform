const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken.js");
const {
  getAllSocketConversation,
  getSocketConversationByUserId,
  getChatbotConversationByConversationId,
  conversationNotification,
  getSocketConversationForChatbot,
  updateConversation,
  deleteConversation,
  updateSocketConversationClosed,
  submitPostChatReview,
} = require("../controllers/conversationController.js");

// Get all conversations
router.get("/", verifyToken, getAllSocketConversation);

router.patch("/update-chats/:id", updateConversation); // update is_pinned
router.delete("/delete-chats/:id", deleteConversation);

// Get conversations by user_id
router.get("/socket", verifyToken, getSocketConversationByUserId);

// Get conversation by identifier (email or name)
router.get("/chatbot", verifyToken, getChatbotConversationByConversationId);

//notification for conversation
router.post(
  "/notification/:conversation_id",
  verifyToken,
  conversationNotification
);

//its for the chatbot
router.get("/socketConversation", getSocketConversationForChatbot);
router.post("/socketConversation/close", updateSocketConversationClosed);
router.post("/submit-review", submitPostChatReview);

module.exports = router;
