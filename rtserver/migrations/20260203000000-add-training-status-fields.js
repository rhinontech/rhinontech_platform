"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("automations", "training_status", {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: "idle",
        });

        await queryInterface.addColumn("automations", "training_progress", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn("automations", "training_job_id", {
            type: Sequelize.STRING(255),
            allowNull: true,
        });

        await queryInterface.addColumn("automations", "training_started_at", {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn("automations", "training_message", {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        // Add index for faster status lookups
        await queryInterface.addIndex("automations", ["training_status"], {
            name: "idx_automations_training_status",
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex("automations", "idx_automations_training_status");
        await queryInterface.removeColumn("automations", "training_message");
        await queryInterface.removeColumn("automations", "training_started_at");
        await queryInterface.removeColumn("automations", "training_job_id");
        await queryInterface.removeColumn("automations", "training_progress");
        await queryInterface.removeColumn("automations", "training_status");
    },
};
