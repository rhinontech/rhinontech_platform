"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("deals", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      contact_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "peoples", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      tags: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },

      custom_fields: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          avatar: { type: "color", value: "#dbeafe", isVisible: true },

          dealValue: { type: "number", value: 0, isVisible: true },
          priority: {
            type: "select",
            value: "Medium",
            options: ["Low", "Medium", "High", "Critical"],
            isVisible: true,
          },
          probability: { type: "number", value: 0, isVisible: true },

          currency: { type: "text", value: "USD", isVisible: true },
          source: { type: "text", value: "", isVisible: true },

          channels: {
            type: "multi-select",
            value: [],
            options: [],
            isVisible: true,
          },

          lastActivityAt: { type: "date", value: null, isVisible: true },
          nextFollowupAt: { type: "date", value: null, isVisible: true },

          notes: { type: "longtext", value: "", isVisible: true },

          createdAtField: { type: "date", value: null, isVisible: true },
          createdByField: { type: "text", value: "", isVisible: true },
        },
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

  async down(queryInterface) {
    await queryInterface.dropTable("deals");
  },
};
