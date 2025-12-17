"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("companies", {
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
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      industry: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      size: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
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
          avatar: { type: "color", value: "#fee2e2", isVisible: true },

          cFundingRaised: { type: "number", value: 0, isVisible: true },
          cLastFundingDate: { type: "date", value: null, isVisible: true },
          cFoundationDate: { type: "date", value: null, isVisible: true },

          addresses: { type: "list:address", value: [], isVisible: true },
          phones: { type: "list:phone", value: [], isVisible: true },
          urls: { type: "list:url", value: [], isVisible: true },
          emails: { type: "list:email", value: [], isVisible: true },

          notes: { type: "longtext", value: "", isVisible: true },

          groups: { type: "list", value: [], isVisible: true },

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
    await queryInterface.dropTable("companies");
  },
};
