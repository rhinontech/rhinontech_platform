"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("emails", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      email_thread_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      in_reply_to: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      ticket_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      subject: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      conversations: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },

      is_new: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      processed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("emails");
  },
};
