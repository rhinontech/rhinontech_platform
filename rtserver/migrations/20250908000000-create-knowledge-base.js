// migrations/20230908000000-create-knowledge-base.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("knowledge_bases", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      uuid: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "rhinon.help",
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("knowledge_bases");
  },
};
