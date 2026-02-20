const {
  bot_conversations,
  support_conversations,
  customers,
  users_profiles,
} = require("../models");

// Get all support conversations for a chatbot
const getAllSocketConversation = async (req, res) => {
  try {
    const { chatbot_id } = req.query;

    if (!chatbot_id) {
      return res.status(400).json({ message: "No chatbot ID provided" });
    }

    const conversations = await support_conversations.findAll({
      where: { chatbot_id },
      order: [["created_at", "DESC"]],
    });

    res.json(conversations);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching conversations", error: err.message });
  }
};

// Update conversation fields (is_pinned, assigned_user_id, etc.)
const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_pinned, assigned_user_id } = req.body;

    const updateData = {};
    if (typeof is_pinned === "boolean") updateData.is_pinned = is_pinned;
    if (assigned_user_id !== undefined)
      updateData.assigned_user_id = assigned_user_id;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message:
          "No valid fields to update. Provide is_pinned or assigned_user_id",
      });
    }

    const [updatedRows, [updatedConversation]] =
      await support_conversations.update(updateData, {
        where: { id },
        returning: true,
      });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(updatedConversation);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating conversation", error: err.message });
  }
};

// Delete conversation
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await support_conversations.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting conversation", error: err.message });
  }
};

// Get support chat (real-time) conversation by user
const getSocketConversationByUserId = async (req, res) => {
  try {
    const { user_id, chatbot_id, chatbot_history } = req.query;

    // organization_id from the authenticated agent (user)
    const { organization_id } = req.user;

    if (!user_id || !chatbot_id || !chatbot_history) {
      return res.status(400).json({
        message: "user_id, chatbot_id, and chatbot_history are required",
      });
    }

    const socketConversation = await support_conversations.findOne({
      where: { user_id, chatbot_id, chatbot_history },
    });

    if (!socketConversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // --- ENRICH WITH PHONE NUMBER (via Customers table) ---
    let phone_number = null;

    try {
      const customer = await customers.findOne({
        where: {
          email: socketConversation.user_email,
          organization_id,
        },
      });

      if (customer?.custom_data) {
        phone_number =
          customer.custom_data.phone_number ||
          customer.custom_data.phone ||
          null;
      }
    } catch (e) {
      console.error("Error fetching customer phone for conversation", e);
    }

    // --- ENRICH WITH ASSIGNED AGENT DETAILS ---
    let assigned_agent = null;
    if (socketConversation.assigned_user_id) {
      try {
        const agentProfile = await users_profiles.findOne({
          where: { user_id: socketConversation.assigned_user_id },
          attributes: ["first_name", "last_name", "image_url"],
        });

        if (agentProfile) {
          assigned_agent = {
            name: `${agentProfile.first_name} ${agentProfile.last_name}`.trim(),
            image: agentProfile.image_url,
          };
        }
      } catch (e) {
        console.error("Error fetching assigned agent profile", e);
      }
    }

    // Convert to plain object to attach new field
    const responseData = socketConversation.toJSON();
    responseData.phone_number = phone_number;
    responseData.assigned_agent = assigned_agent;

    res.json(responseData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching conversation", error: err.message });
  }
};

// Get chatbot (AI) conversation by conversation_id
const getChatbotConversationByConversationId = async (req, res) => {
  try {
    const { chatId, chatbot_id } = req.query;

    const conversation = await bot_conversations.findOne({
      where: { conversation_id: chatId, chatbot_id },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching conversation", error: err.message });
  }
};

// Mark support conversation as seen
const conversationNotification = async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const [updatedRows] = await support_conversations.update(
      { is_new: false },
      { where: { id: conversation_id } }
    );

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "Conversation not found or already marked" });
    }

    res.status(200).json({ message: "Conversation marked as seen" });
  } catch (error) {
    res.status(500).json({ message: "Error updating conversation", error });
  }
};
const getSocketConversationForChatbot = async (req, res) => {
  try {
    const { user_id, chatbot_id, chatbot_history } = req.query; // req.query is fine

    if (!user_id || !chatbot_id || !chatbot_history) {
      return res.status(400).json({
        message: "user_id, chatbot_id, and chatbot_history are required",
      });
    }

    // Sequelize uses `where: { ... }` instead of direct key:value
    const socketConversation = await support_conversations.findOne({
      where: {
        user_id,
        chatbot_id,
        chatbot_history,
      },
    });

    if (!socketConversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // --- ENRICH WITH ASSIGNED AGENT DETAILS ---
    let assigned_agent = null;
    if (socketConversation.assigned_user_id) {
      try {
        const agentProfile = await users_profiles.findOne({
          where: { user_id: socketConversation.assigned_user_id },
          attributes: ["first_name", "last_name", "image_url"],
        });

        if (agentProfile) {
          assigned_agent = {
            name: `${agentProfile.first_name} ${agentProfile.last_name}`.trim(),
            image: agentProfile.image_url,
          };
        }
      } catch (e) {
        console.error("Error fetching assigned agent profile for chatbot", e);
      }
    }

    const responseData = socketConversation.toJSON();
    responseData.assigned_agent = assigned_agent;

    // Optional: Ensure messages is parsed if stored as JSONB
    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error fetching socket conversation:", err);
    res.status(500).json({
      message: "Error fetching conversation",
      error: err.message,
    });
  }
};

// Close a conversation
const updateSocketConversationClosed = async (req, res) => {
  try {
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ message: "conversation_id is required" });
    }

    const [updatedRows, [updatedConversation]] =
      await support_conversations.update(
        { is_closed: true },
        { where: { id: conversation_id }, returning: true }
      );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({
      message: "Conversation closed successfully",
      conversation: updatedConversation,
    });
  } catch (err) {
    console.error("Error closing conversation:", err);
    res.status(500).json({
      message: "Error closing conversation",
      error: err.message,
    });
  }
};

const submitPostChatReview = async (req, res) => {
  try {
    const { conversation_id, review_data } = req.body;

    if (!conversation_id) {
      return res.status(400).json({
        message: "conversation_id is required",
      });
    }

    // Update review
    const [updatedRows, [updatedConversation]] = await bot_conversations.update(
      { post_chat_review: review_data },
      {
        where: { conversation_id },
        returning: true,
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.json({
      message: "Review saved successfully",
      conversation: updatedConversation,
    });
  } catch (err) {
    console.error("Error saving post chat review:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

module.exports = {
  getAllSocketConversation,
  updateConversation,
  deleteConversation,
  getSocketConversationByUserId,
  getChatbotConversationByConversationId,
  conversationNotification,
  getSocketConversationForChatbot,
  updateSocketConversationClosed,
  submitPostChatReview,
};
