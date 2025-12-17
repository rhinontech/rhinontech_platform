"use strict";

module.exports = (sequelize, DataTypes) => {
  const SeoEngagement = sequelize.define(
    "seo_engagements",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: DataTypes.STRING,
      sessionId: DataTypes.STRING,
      userId: DataTypes.STRING,
      type: DataTypes.STRING,
      url: DataTypes.STRING,
      timestamp: DataTypes.BIGINT,
      metadata: DataTypes.JSONB,
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return SeoEngagement;
};
