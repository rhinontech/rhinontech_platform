"use strict";

module.exports = (sequelize, DataTypes) => {
  const SeoPerformance = sequelize.define(
    "seo_performances",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: DataTypes.STRING,
      baseUrl: DataTypes.STRING,
      overallScore: DataTypes.JSONB,
      metrics: DataTypes.JSONB,
      accessibility: DataTypes.JSONB,
      bestPractices: DataTypes.JSONB,
      seo: DataTypes.JSONB,
      opportunities: DataTypes.JSONB,
      diagnostics: DataTypes.JSONB,
      recommendations: DataTypes.JSONB,
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return SeoPerformance;
};
