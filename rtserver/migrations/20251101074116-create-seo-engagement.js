"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("seo_engagements", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chatbot_id: Sequelize.STRING,
      sessionId: Sequelize.STRING,
      userId: Sequelize.STRING,
      type: Sequelize.STRING,
      url: Sequelize.STRING,
      timestamp: Sequelize.BIGINT,
      metadata: Sequelize.JSONB,
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
    await queryInterface.dropTable("seo_engagements");
  },
};
