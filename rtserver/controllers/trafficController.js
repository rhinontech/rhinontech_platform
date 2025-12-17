const {
  live_visitors,
  bot_conversations,
  support_conversations,
} = require("../models");

const getAllVisitor = async (req, res) => {
  const { chatbot_id } = req.params;

  try {

    // 1. Fetch all visitors for this chatbot
    const visitors = await live_visitors.findAll({
      where: { chatbot_id },
    });

    // 2. Extract visitor IDs to batch fetch conversations
    const visitorIds = visitors.map(v => v.visitor_id);

    // 3. Fetch active support conversations for these visitors
    const conversations = await support_conversations.findAll({
      where: {
        user_id: visitorIds,
        is_closed: false, // Only active conversations
      },
      attributes: [
        "id",
        "user_id", // Needed for mapping
        "assigned_user_id",
        "is_new",
        "is_closed",
        "messages",
        "updated_at" // Useful for finding the latest one
      ],
      order: [["id", "ASC"]] // If multiple, later logic can handle picking the right one
    });

    // 4. Enrich visitor data with conversation metadata
    const enrichedVisitors = visitors.map((visitor) => {
      const visitorData = visitor.toJSON();

      // Find conversations for this visitor
      const visitorConversations = conversations.filter(
        c => c.user_id === visitorData.visitor_id
      );

      // If multiple, pick the latest one (e.g., by ID or updated_at)
      let conversation = null;
      if (visitorConversations.length > 0) {
        // Since we ordered by ID ASC, the last one is the latest
        conversation = visitorConversations[visitorConversations.length - 1];
      }

      // Calculate last message role if conversation exists
      let last_message_role = null;
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        last_message_role = lastMessage.role; // 'user' or 'support'
      }

      return {
        ...visitorData,
        support_conversation: conversation, // Include the conversation object if needed by frontend structure
        conversation_status: conversation ? {
          has_conversation: true,
          assigned_user_id: conversation.assigned_user_id,
          is_new: conversation.is_new,
          is_closed: conversation.is_closed,
          last_message_role,
        } : {
          has_conversation: false,
          assigned_user_id: null,
          is_new: false,
          is_closed: false,
          last_message_role: null,
        },
      };
    });

    res.json(enrichedVisitors);
  } catch (err) {
    console.error("[API] Failed to fetch visitors:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getIpAddressForChats = async (req, res) => {
  const { chatbot_id, user_id } = req.query;

  try {
    const visitor = await live_visitors.findOne({
      where: { chatbot_id, visitor_id: user_id },
    });

    res.json(visitor);
  } catch (err) {
    console.error("[API] Failed to fetch visitors:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getIpAddressForTickets = async (req, res) => {
  const { chatbot_id, user_email } = req.query;

  try {
    const visitor = await live_visitors.findOne({
      where: { chatbot_id, visitor_email: user_email },
    });

    res.json(visitor);
  } catch (err) {
    console.error("[API] Failed to fetch visitors:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create a new AI + Support conversation pair
 * - One row in `bot_conversations` (AI chat)
 * - One row in `support_conversations` (real chat)
 */
const createConversationFromTraffic = async (req, res) => {
  try {
    const { user_id, chatbot_id, user_email } = req.body;

    if (!user_id || !chatbot_id || !user_email) {
      return res
        .status(400)
        .json({ message: "user_id, chatbot_id and user_email are required" });
    }

    const timestamp = new Date();
    const chatbot_history = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Create AI conversation record
    const newConversation = await bot_conversations.create({
      user_id,
      user_email,
      chatbot_id,
      user_plan: "Basic",
      conversation_id: chatbot_history,
      title: "Support Chat",
      history: [],
      created_at: timestamp,
      updated_at: timestamp,
    });

    // Create Support conversation record
    const newSocketConversation = await support_conversations.create({
      user_email,
      user_id,
      chatbot_id,
      chatbot_history,
      messages: [
        {
          role: "support",
          text: "Hello, how can I help you today?",
          timestamp,
        },
      ],
      created_at: timestamp,
      updated_at: timestamp,
    });

    res.status(201).json({
      message: "New conversation created successfully.",
      conversation_id: newConversation.conversation_id,
    });
  } catch (err) {
    console.error("Error creating conversation:", err);
    res.status(500).json({
      message: "Error creating conversation.",
      error: err.message,
    });
  }
};

module.exports = {
  getAllVisitor,
  getIpAddressForChats,
  createConversationFromTraffic,
  getIpAddressForTickets,
};
