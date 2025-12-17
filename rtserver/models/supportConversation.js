"use strict";
module.exports = (sequelize, DataTypes) => {
  const SupportConversation = sequelize.define(
    "support_conversations",
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
        allowNull: true,
      },
      chatbot_history: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      assigned_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      messages: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      is_closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_new: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",

      // indexes: [
      //   { fields: ["user_id"] },
      //   { fields: ["chatbot_id"] },
      //   { fields: ["assigned_user_id"] },
      // ],
    }
  );

  return SupportConversation;
};
