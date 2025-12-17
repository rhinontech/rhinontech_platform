"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("peoples", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      full_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      emails: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },

      phones: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },

      company_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "companies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true,
      },

      job_title: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      tags: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: true,
      },

      custom_fields: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          avatar: { type: "color", value: "#dbeafe", isVisible: true },

          pGender: { type: "text", value: "", isVisible: true },
          pBirthday: { type: "date", value: null, isVisible: true },

          groups: { type: "list", value: [], isVisible: true },

          totalInteractions: { type: "number", value: 0, isVisible: true },
          lastInteraction: { type: "date", value: null, isVisible: true },
          lastNetworkInteractionDate: {
            type: "date",
            value: null,
            isVisible: true,
          },
          lastNetworkInteractionBy: {
            type: "list",
            value: [],
            isVisible: true,
          },

          addresses: { type: "list:address", value: [], isVisible: true },
          urls: { type: "list:url", value: [], isVisible: true },

          companies: { type: "list:company", value: [], isVisible: true },

          notes: { type: "longtext", value: "", isVisible: true },

          createdAtField: { type: "date", value: null, isVisible: true },
          createdByField: { type: "text", value: "", isVisible: true },

          addedToGroupAt: { type: "date", value: null, isVisible: true },
          addedToGroupBy: { type: "text", value: "", isVisible: true },
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("peoples");
  },
};
