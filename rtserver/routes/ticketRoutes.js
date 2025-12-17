const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  getAllTickets,
  getTicketById,
  createTicket,
  deleteTicket,
  updateTicket,
  sendTicketReplyEmail,
  ticketWebhook,
  createFromTicket,
  getTicketforChatbot,
  updateTicketRating,
  getAllEmails,
  getEmailById,
  mergeEmailToTicket,
  mergeSupportEmailToTicket,
  getClosedTicketsByCustomer,
} = require("../controllers/ticketController");

const router = express.Router();

router.get("/", verifyToken, getAllTickets);
router.get("/ticket/:ticket_id", verifyToken, getTicketById);
router.get(
  "/tickets/:ticket_id/history",
  verifyToken,
  getClosedTicketsByCustomer
);

router.post("/create-from-ticket", createFromTicket);
router.delete("/tickets/:ticket_id", deleteTicket);
router.put("/update-ticket/:ticket_id", verifyToken, updateTicket);

router.post("/reply-email/:ticket_id", verifyToken, sendTicketReplyEmail);

router.post("/webhook", ticketWebhook);

// emails
router.get("/emails", verifyToken, getAllEmails);
// Fetch specific email by ID (or email_thread_id)
router.get("/emails/:email_id", verifyToken, getEmailById);
router.post(
  "/emails/merge-support-email",
  verifyToken,
  mergeSupportEmailToTicket
);
router.post("/emails/merge-gmail-email", verifyToken, mergeEmailToTicket);

//chatbot
router.post("/create-ticket", createTicket);
router.post("/get-tickets", getTicketforChatbot);
router.post("/ticket-rating", updateTicketRating);

module.exports = router;
