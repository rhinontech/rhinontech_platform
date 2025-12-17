const { EventEmitter } = require("events");
const { activities } = require("../models");

// Create a global event bus
const eventBus = new EventEmitter();

// Listen for all activity events
eventBus.on("activity", async (payload) => {
  try {
    await activities.create({
      user_id: payload.userId,
      organization_id: payload.organizationId,
      action: payload.action,
      message: payload.message,
      metadata: payload.metadata || null,
    });
  } catch (error) {
    console.error("Failed to save activity:", error);
  }
});

// Utility function to emit events
function logActivity(userId, organizationId, action, message, metadata = null) {
  eventBus.emit("activity", {
    userId,
    organizationId,
    action,
    message,
    metadata,
  });
}

module.exports = { logActivity };
