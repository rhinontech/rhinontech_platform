"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seo_page_views", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      chatbot_id: {
        type: Sequelize.STRING,
      },
      sessionId: {
        type: Sequelize.STRING,
      },
      userId: {
        type: Sequelize.STRING,
      },
      url: {
        type: Sequelize.STRING,
      },
      referrer: {
        type: Sequelize.STRING,
      },
      userAgent: {
        type: Sequelize.STRING,
      },
      timestamp: {
        type: Sequelize.BIGINT,
      },
      utm_source: {
        type: Sequelize.STRING,
      },
      utm_medium: {
        type: Sequelize.STRING,
      },
      utm_campaign: {
        type: Sequelize.STRING,
      },
      utm_term: {
        type: Sequelize.STRING,
      },
      utm_content: {
        type: Sequelize.STRING,
      },
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
    await queryInterface.dropTable("seo_page_views");
  },
};
