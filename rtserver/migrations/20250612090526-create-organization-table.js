"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("organizations", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      organization_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      company_size: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      company_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // subscription_tier: {
      //   type: Sequelize.STRING,
      //   defaultValue: "trial",
      // },
      // subscription_start_date: {
      //   type: Sequelize.DATE,
      //   allowNull: false,
      //   defaultValue: Sequelize.fn("NOW"),
      // },
      // subscription_end_date: {
      //   type: Sequelize.DATE,
      //   allowNull: false,
      //   defaultValue: Sequelize.literal("NOW() + INTERVAL '14 days'"),
      // },
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
    await queryInterface.dropTable("organizations");
  },
};
