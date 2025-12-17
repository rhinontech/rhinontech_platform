"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("tasks", "parent_task_id", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "tasks",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });

        await queryInterface.removeColumn("tasks", "subtasks");
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("tasks", "parent_task_id");

        await queryInterface.addColumn("tasks", "subtasks", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: [],
        });
    },
};
