"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("tasks", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            task_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            organization_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "organizations",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "in-progress",
            },
            priority: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "medium",
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "task",
            },
            assignee_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            reporter_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            due_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            estimated_hours: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            actual_hours: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            tags: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: true,
                defaultValue: [],
            },
            attachments: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            comments: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            subtasks: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            activities: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        // Add composite unique constraint on task_id and organization_id
        await queryInterface.addIndex("tasks", ["task_id", "organization_id"], {
            unique: true,
            name: "unique_task_id_per_organization",
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("tasks");
    },
};
