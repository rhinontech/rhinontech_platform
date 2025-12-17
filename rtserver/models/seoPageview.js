"use strict";

module.exports = (sequelize, DataTypes) => {
  const SeoPageView = sequelize.define(
    "seo_page_views",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: DataTypes.STRING,
      sessionId: DataTypes.STRING,
      userId: DataTypes.STRING,
      url: DataTypes.STRING,
      referrer: DataTypes.STRING,
      userAgent: DataTypes.STRING,
      timestamp: DataTypes.BIGINT,
      utm_source: DataTypes.STRING,
      utm_medium: DataTypes.STRING,
      utm_campaign: DataTypes.STRING,
      utm_term: DataTypes.STRING,
      utm_content: DataTypes.STRING,
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return SeoPageView;
};
