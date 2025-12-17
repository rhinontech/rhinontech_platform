'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('teams_members', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            channel_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'teams_channels',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            organization_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'organizations',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            role: {
                type: Sequelize.ENUM('admin', 'member'),
                allowNull: false,
                defaultValue: 'member',
            },
            joined_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('teams_members', ['channel_id']);
        await queryInterface.addIndex('teams_members', ['user_id']);
        await queryInterface.addIndex('teams_members', ['organization_id']);

        // Unique constraint: user can only be in a channel once
        await queryInterface.addIndex('teams_members', ['channel_id', 'user_id'], {
            unique: true,
            name: 'unique_channel_user',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('teams_members');
    },
};
