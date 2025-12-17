const express = require("express");
const router = express.Router();
const {
  exchangeCode,
  getAccounts,
  disconnectAccount,
  setDefaultWhatsAppAccount,
  sendMessage,
  verifyWebhook,
  handleWebhook,
  getTemplates,
  getContacts,
  getMessages,
  getMediaProxy,
} = require("../controllers/whatsppController");
const verifyToken = require("../middleware/verifyToken");

// OAuth & Account Management
router.post("/exchange-code", verifyToken, exchangeCode);
router.get("/accounts", verifyToken, getAccounts);
router.delete("/accounts/:account_id", verifyToken, disconnectAccount);
router.put("/accounts/:account_id/set-default", verifyToken, setDefaultWhatsAppAccount);
router.get("/templates", verifyToken, getTemplates);

// Messaging
router.get("/contacts", verifyToken, getContacts);
router.get("/messages", verifyToken, getMessages);
router.post("/messages/send", verifyToken, sendMessage);

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Media Proxy (Open route for images)
router.get("/media/:media_id", getMediaProxy);

// Upload Media
router.post("/upload-media", verifyToken, upload.single("file"), require("../controllers/whatsppController").uploadMedia);

// Webhooks
router.get("/webhook", verifyWebhook);
router.post("/webhook", handleWebhook);

module.exports = router;
