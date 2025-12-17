"use strict";

module.exports = (sequelize, DataTypes) => {
  const SeoSession = sequelize.define(
    "seo_sessions",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: DataTypes.STRING,
      sessionId: DataTypes.STRING,
      userId: DataTypes.STRING,
      userAgent: DataTypes.STRING,
      screenSize: DataTypes.STRING,
      language: DataTypes.STRING,
      isReturning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      country: DataTypes.STRING,
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return SeoSession;
};
