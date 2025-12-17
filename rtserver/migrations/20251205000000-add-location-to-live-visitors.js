"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("live_visitors", "city", {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn("live_visitors", "region", {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn("live_visitors", "country", {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn("live_visitors", "latitude", {
            type: Sequelize.DECIMAL(10, 8),
            allowNull: true,
        });

        await queryInterface.addColumn("live_visitors", "longitude", {
            type: Sequelize.DECIMAL(11, 8),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("live_visitors", "city");
        await queryInterface.removeColumn("live_visitors", "region");
        await queryInterface.removeColumn("live_visitors", "country");
        await queryInterface.removeColumn("live_visitors", "latitude");
        await queryInterface.removeColumn("live_visitors", "longitude");
    },
};
