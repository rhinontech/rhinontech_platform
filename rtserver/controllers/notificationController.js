const {
    notifications,
    chatbots,
} = require("../models");

const getUnreadNotifications = async (req, res) => {
    try {
        const { chatbot_id } = req.params;

        if (!chatbot_id) {
            return res.status(400).json({ error: "Chatbot ID is required" });
        }

        // 1. Resolve Organization ID via Chatbot
        const chatbot = await chatbots.findOne({
            where: { chatbot_id },
            attributes: ["organization_id"],
        });

        if (!chatbot) {
            return res.status(404).json({ error: "Chatbot not found" });
        }

        // 2. Fetch Notifications
        const notificationList = await notifications.findAll({
            where: {
                organization_id: chatbot.organization_id,
                status: "unread",
            },
            order: [["created_at", "DESC"]],
            limit: 50,
        });

        return res.status(200).json({ notifications: notificationList });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notification_id } = req.body;

        if (!notification_id) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        await notifications.update(
            { status: "read" },
            { where: { id: notification_id } }
        );

        return res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification read:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { notification_id } = req.params;

        if (!notification_id) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        const deleted = await notifications.destroy({
            where: { id: notification_id },
        });

        if (!deleted) {
            return res.status(404).json({ error: "Notification not found" });
        }

        return res.status(200).json({ message: "Notification removed" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getUnreadNotifications,
    markAsRead,
    deleteNotification,
};
