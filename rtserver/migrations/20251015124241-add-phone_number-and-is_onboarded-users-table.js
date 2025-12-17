"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "phone_number", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "is_onboarded", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    //  Add email OTP fields
    await queryInterface.addColumn("users", "email_otp", {
      type: Sequelize.STRING(8),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "email_otp_expires_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "phone_number");
    await queryInterface.removeColumn("users", "is_onboarded");
    await queryInterface.removeColumn("users", "email_otp");
    await queryInterface.removeColumn("users", "email_otp_expires_at");
  },
};
