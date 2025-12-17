"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seo_performances", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: Sequelize.STRING,
      baseUrl: Sequelize.STRING,
      overallScore: Sequelize.JSONB,
      metrics: Sequelize.JSONB,
      accessibility: Sequelize.JSONB,
      bestPractices: Sequelize.JSONB,
      seo: Sequelize.JSONB,
      opportunities: Sequelize.JSONB,
      diagnostics: Sequelize.JSONB,
      recommendations: Sequelize.JSONB,
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("seo_performances");
  },
};
