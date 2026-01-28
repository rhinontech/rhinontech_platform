'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('seed_data_registry', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            table_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Name of the table containing the seed record'
            },
            record_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'ID of the seed data record in the respective table'
            },
            organization_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Organization that owns this seed data',
                references: {
                    model: 'organizations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn('NOW')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Add indexes for efficient querying
        await queryInterface.addIndex('seed_data_registry', ['organization_id'], {
            name: 'idx_seed_data_registry_org_id'
        });

        await queryInterface.addIndex('seed_data_registry', ['table_name', 'record_id'], {
            name: 'idx_seed_data_registry_table_record',
            unique: true
        });

        await queryInterface.addIndex('seed_data_registry', ['table_name', 'organization_id'], {
            name: 'idx_seed_data_registry_table_org'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('seed_data_registry');
    }
};
