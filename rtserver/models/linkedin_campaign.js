module.exports = (sequelize, DataTypes) => {
  const LinkedInCampaign = sequelize.define(
    'linkedin_campaigns',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      campaign_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      campaign_description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      campaign_type: {
        type: DataTypes.ENUM('post', 'article', 'video', 'carousel', 'poll'),
        allowNull: false,
        defaultValue: 'post'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      media_urls: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      },
      hashtags: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      },
      target_audience: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      scheduled_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'published', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      linkedin_post_id: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      engagement_metrics: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      is_sponsored: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      call_to_action: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      cta_link: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      published_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'linkedin_campaigns',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return LinkedInCampaign;
};
