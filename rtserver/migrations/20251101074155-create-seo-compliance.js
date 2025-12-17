"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seo_compliances", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: Sequelize.STRING,
      baseUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      seoScore: Sequelize.STRING,
      passedChecks: Sequelize.INTEGER,
      totalChecks: Sequelize.INTEGER,
      categories: Sequelize.JSONB,
      actionItems: Sequelize.JSONB,
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
    await queryInterface.dropTable("seo_compliances");
  },
};
