const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  getAllVisitor,
  getIpAddressForChats,
  getIpAddressForTickets,
  createConversationFromTraffic,
} = require("../controllers/trafficController");

const router = express.Router();

router.get("/chat-ip-address", getIpAddressForChats);

router.get(
  "/ticket-ip-address",
  getIpAddressForTickets
);

router.post("/create-conversation", createConversationFromTraffic);

router.get("/visitors/:chatbot_id", getAllVisitor);

module.exports = router;
