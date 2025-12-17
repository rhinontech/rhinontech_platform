"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pipelines", {
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
      view_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "views", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      pipeline_manage_type: {
        type: Sequelize.ENUM("company", "people", "deal", "default_customers"),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stages: {
        type: Sequelize.JSONB,
        defaultValue: [],
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
    await queryInterface.dropTable("pipelines");
  },
};
