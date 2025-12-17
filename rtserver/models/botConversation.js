"use strict";
module.exports = (sequelize, DataTypes) => {
  const BotConversations = sequelize.define(
    "bot_conversations",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      chatbot_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_plan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      conversation_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      history: {
        // array of messages (JSON)
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      post_chat_review: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return BotConversations;
};
