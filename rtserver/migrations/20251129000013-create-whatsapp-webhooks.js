"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("whatsapp_webhooks", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            account_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "whatsapp_accounts",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            organization_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "organizations",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            event_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            payload: {
                type: Sequelize.JSONB,
                allowNull: false,
            },
            processed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            processed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        // Add indexes
        await queryInterface.addIndex("whatsapp_webhooks", ["account_id"]);
        await queryInterface.addIndex("whatsapp_webhooks", ["organization_id"]);
        await queryInterface.addIndex("whatsapp_webhooks", ["event_type"]);
        await queryInterface.addIndex("whatsapp_webhooks", ["processed"]);
        await queryInterface.addIndex("whatsapp_webhooks", ["created_at"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("whatsapp_webhooks");
    },
};
