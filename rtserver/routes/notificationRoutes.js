const express = require("express");
const router = express.Router();
const {
  getUnreadNotifications,
  markAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

/*
  Route: /api/notifications/unread/:chatbot_id
  Method: GET
*/
router.get("/unread/:chatbot_id", getUnreadNotifications);

/*
  Route: /api/notifications/read
  Method: POST
*/
router.post("/read", markAsRead);

/*
  Route: /api/notifications/:notification_id
  Method: DELETE
*/
router.delete("/:notification_id", deleteNotification);

module.exports = router;
