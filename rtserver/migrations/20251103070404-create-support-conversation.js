"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("support_conversations", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      chatbot_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      chatbot_history: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      assigned_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      messages: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      is_closed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_new: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable("support_conversations");
  },
};
