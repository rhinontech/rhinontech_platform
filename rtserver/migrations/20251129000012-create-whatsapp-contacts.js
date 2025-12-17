"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("whatsapp_contacts", {
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
            phone_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            profile_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            is_blocked: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            last_message_at: {
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

        // Add unique constraint
        await queryInterface.addConstraint("whatsapp_contacts", {
            fields: ["account_id", "phone_number"],
            type: "unique",
            name: "unique_account_phone",
        });

        // Add indexes
        await queryInterface.addIndex("whatsapp_contacts", ["account_id"]);
        await queryInterface.addIndex("whatsapp_contacts", ["organization_id"]);
        await queryInterface.addIndex("whatsapp_contacts", ["phone_number"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("whatsapp_contacts");
    },
};
