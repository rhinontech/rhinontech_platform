module.exports = (sequelize, DataTypes) => {
  const LinkedInToken = sequelize.define(
    'linkedin_tokens',
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
      access_token: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      token_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Bearer'
      },
      expires_in: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      scope: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      linkedin_user_id: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      linkedin_profile_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'linkedin_tokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return LinkedInToken;
};
