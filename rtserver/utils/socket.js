const {
  live_visitors,
  support_conversations,
  bot_conversations,
} = require("../models");

module.exports = (io) => {
  const visitorSockets = new Map(); // visitor_id → socket_id
  const manualUsers = new Map(); // socket.id -> { callId, username }
  const callIdToSocket = new Map(); // callId -> socket.id
  // Main Socket Handler

  io.on("connection", async (socket) => {
    console.log("[Socket Connected]", socket.id);

    // ID Registration
    const id = socket.handshake.query?.id;
    if (id) socket.join(`id:${id}`);

    socket.on("register", ({ id }) => {
      if (!id) return;
      socket.data.registeredId = id;
      socket.join(`id:${id}`);
      console.log(`[ID Register] ${id} -> ${socket.id}`);
    });

    // Join Organization Room (for WhatsApp updates etc.)
    socket.on("join_org", ({ organization_id }) => {
      if (!organization_id) return;
      socket.join(`org_${organization_id}`);
      console.log(`[Socket] Joined org_${organization_id}`);
    });

    // ===== TEAMCHAT HANDLERS =====

    // Join TeamChat rooms (user room + channel rooms)
    socket.on("join_team_chat", ({ userId, channelIds = [] }) => {
      if (!userId) return;

      // Join user-specific room for DMs and notifications
      socket.join(`user:${userId}`);
      console.log(`[TeamChat] User ${userId} joined personal room`);

      // Join all channel rooms
      channelIds.forEach((channelId) => {
        socket.join(`channel:${channelId}`);
        console.log(`[TeamChat] User ${userId} joined channel:${channelId}`);
      });

      // Broadcast presence update
      socket.broadcast.emit("user_presence", {
        userId,
        status: "online",
      });
    });

    // Join a specific channel room
    socket.on("join_channel", ({ channelId, userId }) => {
      if (!channelId) return;
      socket.join(`channel:${channelId}`);
      console.log(`[TeamChat] User ${userId} joined channel:${channelId}`);
    });

    // Join a DM room
    socket.on("join_dm", ({ dmId, userId }) => {
      if (!dmId) return;
      socket.join(`dm:${dmId}`);
      console.log(`[TeamChat] User ${userId} joined dm:${dmId}`);
    });

    // Typing indicator
    socket.on(
      "typing_indicator",
      ({ scopeType, scopeId, userId, isTyping }) => {
        const room =
          scopeType === "channel" ? `channel:${scopeId}` : `dm:${scopeId}`;
        socket.to(room).emit("user_typing", {
          scopeType,
          scopeId,
          userId,
          isTyping,
        });
      }
    );

    // Update presence status
    socket.on("update_presence", ({ userId, status }) => {
      socket.broadcast.emit("user_presence", {
        userId,
        status, // online, offline, busy
      });
      console.log(`[TeamChat] User ${userId} status: ${status}`);
    });

    // ===== END TEAMCHAT HANDLERS =====

    const {
      visitor_id,
      chatbot_id,
      ip_address,
      dashboard,
      user_email,
      is_visitor,
    } = socket.handshake.query;

    // Dashboard Connections
    if (dashboard === "true" && chatbot_id) {
      const dashboardRoom = `dashboard:${chatbot_id}`;
      socket.join(dashboardRoom);
      console.log(`[Dashboard Connected] ${dashboardRoom}`);

      socket.on("open_chat", ({ room, conversationId }) => {
        console.log("Trigger the chatbot :", conversationId);
        io.to(room).emit("open_chat", { conversationId });
      });

      socket.on("disconnect", () => {
        console.log(`[Dashboard Disconnected] ${dashboardRoom}`);
      });

      return; // Dashboard logic ends here
    }

    // Visitor Connections

    if (is_visitor === "true" && chatbot_id && visitor_id) {
      const room = `${chatbot_id}:${visitor_id}`;
      socket.join(room);
      visitorSockets.set(visitor_id, socket.id);

      try {
        const [visitorRecord] = await live_visitors.upsert({
          chatbot_id,
          visitor_id,
          room,
          visitor_email: user_email,
          socket_id: socket.id,
          ip_address: ip_address || null,
          last_seen: new Date(),
          is_online: true,
        });

        console.log(`[Visitor Connected] ${room}`);

        io.to(`dashboard:${chatbot_id}`).emit("visitor_update", {
          type: "connected",
          visitor: visitorRecord.dataValues,
        });
      } catch (err) {
        console.error("[Sequelize] Error saving visitor:", err);
      }

      socket.on("disconnect", async () => {
        visitorSockets.delete(visitor_id);
        try {
          await live_visitors.update(
            { is_online: false, last_seen: new Date() },
            { where: { socket_id: socket.id } }
          );
          const updatedVisitor = await live_visitors.findOne({
            where: { visitor_id },
          });
          if (updatedVisitor)
            io.to(`dashboard:${chatbot_id}`).emit("visitor_update", {
              type: "disconnected",
              visitor: updatedVisitor,
            });
        } catch (err) {
          console.error("[Sequelize] Error updating disconnect:", err);
        }
      });
    }

    // Message Handling

    socket.on("message", async (data) => {
      console.log("📩 Received message:", data);
      const {
        user_email,
        role,
        chatbot_id,
        chatbot_history,
        text,
        timestamp,
        user_id,
      } = data;

      if (!text) return console.error("Message text is required");

      try {
        // Ensure bot conversation exists
        let conv = await bot_conversations.findOne({
          where: {
            user_id,
            chatbot_id,
            conversation_id: chatbot_history,
            user_email,
          },
        });

        if (!conv) {
          conv = await bot_conversations.create({
            user_id,
            user_email,
            chatbot_id,
            user_plan: "Basic",
            conversation_id: chatbot_history,
            title: "Support Chat",
            history: [],
            created_at: timestamp,
          });
        }

        // Ensure support conversation exists
        let conversation = await support_conversations.findOne({
          where: { user_id, chatbot_id, chatbot_history, user_email },
        });

        let isNewConversation = false;

        if (!conversation) {
          conversation = await support_conversations.create({
            user_id,
            user_email,
            chatbot_id,
            chatbot_history,
            messages: [],
            is_new: true,
          });
          isNewConversation = true;
        }

        const updatedMessages = Array.isArray(conversation.messages)
          ? [...conversation.messages, { role, text, timestamp }]
          : [{ role, text, timestamp }];

        await conversation.update({
          messages: updatedMessages,
          is_new: true,
          updated_at: new Date(),
        });

        if (isNewConversation) {
          io.emit("newConversation", conversation);
        } else {
          socket.broadcast.emit("message", data);
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Conversation Close Handler
    socket.on("conversation:closed", async (data) => {
      console.log("🔒 Conversation closed:", data);
      const { chatbot_history, conversation_id } = data;

      try {
        
        // Broadcast to all connected clients (including admin dashboard)
        io.emit("conversation:closed", {
          ...data,
          chatbot_history: chatbot_history || conversation_id,
        });

        console.log("✅ Conversation close event broadcasted");
      } catch (error) {
        console.error("❌ Error handling conversation close:", error);
      }
    });

    // VOICE CALL HANDLER

    socket.on("register_manual", ({ callId, username }) => {
      if (!callId || !username) return;

      // Prevent duplicate registration
      if (
        callIdToSocket.has(callId) &&
        callIdToSocket.get(callId) !== socket.id
      ) {
        socket.emit("error", "Call ID already in use.");
        return;
      }

      manualUsers.set(socket.id, { callId, username });
      callIdToSocket.set(callId, socket.id);
      socket.emit("registered_manual", { callId });
      console.log(`🎧 Registered manual user: ${username} (${callId})`);
    });

    socket.on("call_user_manual", ({ targetCallId }) => {
      const caller = manualUsers.get(socket.id);
      const targetSocketId = callIdToSocket.get(targetCallId);

      if (!caller) return console.log("❌ Caller not registered");
      if (!targetSocketId)
        return socket.emit("error", "User not found or offline.");

      io.to(targetSocketId).emit("call_request_manual", {
        from: socket.id,
        fromName: caller.username,
        fromCallId: caller.callId,
      });

      console.log(`📞 Manual call: ${caller.callId} → ${targetCallId}`);
    });

    socket.on("call_accepted_manual", ({ to }) => {
      console.log(` Call accepted by ${socket.id}, forwarding to ${to}`);
      io.to(to).emit("call_accepted_manual", { from: socket.id });
    });

    socket.on("call_rejected_manual", ({ to }) => {
      console.log(`❌ Call rejected by ${socket.id}, notifying ${to}`);
      io.to(to).emit("call_rejected_manual");
    });

    socket.on("offer_manual", ({ offer, to }) => {
      io.to(to).emit("offer_manual", { offer, from: socket.id });
    });

    socket.on("answer_manual", ({ answer, to }) => {
      io.to(to).emit("answer_manual", { answer, from: socket.id });
    });

    socket.on("ice_candidate_manual", ({ candidate, to }) => {
      io.to(to).emit("ice_candidate_manual", { candidate, from: socket.id });
    });

    socket.on("end_call_manual", () => {
      const caller = manualUsers.get(socket.id);
      if (!caller) return;

      // Find the peer currently connected
      for (const [peerSocketId, peer] of manualUsers.entries()) {
        if (peerSocketId !== socket.id) {
          io.to(peerSocketId).emit("call_ended_manual", {
            from: socket.id,
            fromCallId: caller.callId,
          });
        }
      }

      console.log(`📴 Call ended by ${caller.callId}`);
    });

    socket.on("disconnect", () => {
      const user = manualUsers.get(socket.id);
      if (user) {
        console.log(`👋 ${user.username} (${user.callId}) disconnected`);
        callIdToSocket.delete(user.callId);
        manualUsers.delete(socket.id);
      }
    });
  });
};
