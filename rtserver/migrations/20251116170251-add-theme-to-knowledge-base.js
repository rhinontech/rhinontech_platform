"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("knowledge_bases", "theme", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        logo: null,
        favicon: null,
        background_image: null,
        primary_color: "#1e3a8a",
        seo: {
          title: null,
          description: null,
        }
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("knowledge_bases", "theme");
  },
};
