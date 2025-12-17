"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("chatbot_campaigns", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            organization_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "organizations",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "NO ACTION",
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: "Campaign type: recurring or one-time",
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "draft",
                comment: "Campaign status: active, draft, or paused",
            },
            content: {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {},
                comment: "Campaign content including template, layout, heading, media, buttons",
            },
            targeting: {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {},
                comment: "Targeting rules including visitor type, triggers, and conditions",
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW"),
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("chatbot_campaigns");
    },
};
