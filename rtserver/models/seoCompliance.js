"use strict";

module.exports = (sequelize, DataTypes) => {
  const SeoCompliance = sequelize.define(
    "seo_compliances",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: DataTypes.STRING,
      baseUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      seoScore: DataTypes.STRING,
      passedChecks: DataTypes.INTEGER,
      totalChecks: DataTypes.INTEGER,
      categories: DataTypes.JSONB,
      actionItems: DataTypes.JSONB,
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return SeoCompliance;
};
