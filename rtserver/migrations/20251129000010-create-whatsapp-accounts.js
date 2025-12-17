"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("whatsapp_accounts", {
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
                onDelete: "CASCADE",
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            phone_number_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            waba_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            business_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            display_phone_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            verified_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            quality_rating: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            access_token: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            token_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: "Bearer",
            },
            token_expires_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: "active",
            },
            is_default: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            last_sync_at: {
                type: Sequelize.DATE,
                allowNull: true,
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

        // Add indexes
        await queryInterface.addIndex("whatsapp_accounts", ["organization_id"]);
        await queryInterface.addIndex("whatsapp_accounts", ["user_id"]);
        await queryInterface.addIndex("whatsapp_accounts", ["phone_number_id"]);
        await queryInterface.addIndex("whatsapp_accounts", ["status"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("whatsapp_accounts");
    },
};
