'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('linkedin_campaigns', {
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
      campaign_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      campaign_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      campaign_type: {
        type: Sequelize.ENUM('post', 'article', 'video', 'carousel', 'poll'),
        allowNull: false,
        defaultValue: 'post'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      media_urls: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of media URLs (images, videos, documents)'
      },
      hashtags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of hashtags'
      },
      target_audience: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Targeting criteria (industries, job titles, locations, etc.)'
      },
      scheduled_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the campaign should be posted'
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'published', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      linkedin_post_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'LinkedIn post ID after publishing'
      },
      engagement_metrics: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Likes, comments, shares, impressions, clicks'
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Campaign budget if it is a sponsored post'
      },
      is_sponsored: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      call_to_action: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'CTA button text and link'
      },
      cta_link: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details if campaign failed'
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
    await queryInterface.addIndex('linkedin_campaigns', ['organization_id']);
    await queryInterface.addIndex('linkedin_campaigns', ['user_id']);
    await queryInterface.addIndex('linkedin_campaigns', ['status']);
    await queryInterface.addIndex('linkedin_campaigns', ['scheduled_time']);
    await queryInterface.addIndex('linkedin_campaigns', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('linkedin_campaigns');
  }
};
