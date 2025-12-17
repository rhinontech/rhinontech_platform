"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("whatsapp_messages", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            account_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "whatsapp_accounts",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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
            message_id: {
                type: Sequelize.STRING(255),
                allowNull: true,
                unique: true,
            },
            wamid: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            from_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            to_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            direction: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            message_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            media_url: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            media_mime_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            caption: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            template_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            template_language: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            template_params: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: "pending",
            },
            error_code: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            delivered_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            read_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            conversation_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            contact_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        // Add indexes
        await queryInterface.addIndex("whatsapp_messages", ["account_id"]);
        await queryInterface.addIndex("whatsapp_messages", ["organization_id"]);
        await queryInterface.addIndex("whatsapp_messages", ["message_id"]);
        await queryInterface.addIndex("whatsapp_messages", ["from_number"]);
        await queryInterface.addIndex("whatsapp_messages", ["to_number"]);
        await queryInterface.addIndex("whatsapp_messages", ["direction"]);
        await queryInterface.addIndex("whatsapp_messages", ["status"]);
        await queryInterface.addIndex("whatsapp_messages", ["created_at"]);
        await queryInterface.addIndex("whatsapp_messages", ["conversation_id"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("whatsapp_messages");
    },
};
