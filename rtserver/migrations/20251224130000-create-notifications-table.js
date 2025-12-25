"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("notifications", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
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
            type: {
                type: Sequelize.STRING,
                allowNull: false, // e.g., 'call', 'system', 'alert'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            data: {
                type: Sequelize.JSONB,
                defaultValue: {},
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "unread", // unread, read, archived
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        await queryInterface.addIndex("notifications", ["organization_id", "status"]);
        await queryInterface.addIndex("notifications", ["created_at"]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("notifications");
    },
};
