// models/onboarding.js
module.exports = (sequelize, DataTypes) => {
  const Onboarding = sequelize.define(
    "onboardings",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      // Store which pages have completed their onboarding tour
      tours_completed: {
        type: DataTypes.JSONB, // e.g. { "dashboard": true, "chats": false }
        defaultValue: {},
      },

      // Store which pages' banners have been seen
      banners_seen: {
        type: DataTypes.JSONB, // e.g. { "dashboard": true, "tickets": false }
        defaultValue: {},
      },

      // Store which pages' guides have been completed (installation guide, etc.)
      installation_guide: {
        type: DataTypes.JSONB, // e.g. { "dashboard": true }
        defaultValue: {},
      },

      // Whether chatbot SDK is installed overall
      chatbot_installed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Onboarding;
};
