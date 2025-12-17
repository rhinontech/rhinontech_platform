'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('linkedin_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'LinkedIn OAuth access token'
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'LinkedIn OAuth refresh token'
      },
      token_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Bearer'
      },
      expires_in: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Token expiry time in seconds'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Absolute expiry timestamp'
      },
      scope: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'OAuth scopes granted'
      },
      linkedin_user_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'LinkedIn user/organization ID'
      },
      linkedin_profile_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'LinkedIn profile information'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('linkedin_tokens', ['organization_id']);
    await queryInterface.addIndex('linkedin_tokens', ['user_id']);
    await queryInterface.addIndex('linkedin_tokens', ['linkedin_user_id']);
    await queryInterface.addIndex('linkedin_tokens', ['is_active']);
    await queryInterface.addIndex('linkedin_tokens', ['expires_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('linkedin_tokens');
  }
};
