const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  getChatbotConfigForChatbot,
  setChatbotInstalled,
  createAndUpdateChatbotConfig,
  getChatbotConfigForWebApp,
  updateApiKeyForFreeTrail,
  getApiKeyForFreeTrail,
  getWhatsAppConfig,
  getCustomerPhone,
  saveCustomerPhone,
} = require("../controllers/chatbotController");
const router = express.Router();

/// this is for chatbot
router.get("/chatbot", getChatbotConfigForChatbot);
router.get("/whatsapp-config", getWhatsAppConfig);
router.get("/customer-phone", getCustomerPhone);
router.post("/customer-phone", saveCustomerPhone);

router.post("/set-installed", setChatbotInstalled);

//this are for webapp
router.patch("/chatbot-config", verifyToken, createAndUpdateChatbotConfig);

router.get("/chatbots", verifyToken, getChatbotConfigForWebApp);

//api-key
router.get("/get-api-key", verifyToken, getApiKeyForFreeTrail);
router.post("/update-api-key", verifyToken, updateApiKeyForFreeTrail);

module.exports = router;
