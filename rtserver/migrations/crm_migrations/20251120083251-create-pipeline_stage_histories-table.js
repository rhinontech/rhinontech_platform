"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pipeline_stage_histories", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      pipeline_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "pipelines", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      entity_type: {
        type: Sequelize.ENUM("company", "people", "deal", "default_customers"),
        allowNull: false,
      },

      from_stage_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      to_stage_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      moved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      moved_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      duration_in_stage: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    await queryInterface.dropTable("pipeline_stage_histories");
  },
};
