"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("views", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "groups", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      view_manage_type: {
        type: Sequelize.ENUM("company", "people", "deal", "default_customers"),
        allowNull: false,
      },
      view_type: {
        type: Sequelize.ENUM("pipeline", "table"),
        allowNull: false,
      },
      view_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      table_columns: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
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
    await queryInterface.dropTable("views");
  },
};
