// models/KnowledgeBase.js
const { customAlphabet } = require("nanoid");

// lowercase letters + numbers + hyphen
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789-", 21);

module.exports = (sequelize, DataTypes) => {
  const KnowledgeBase = sequelize.define(
    "knowledge_bases", {
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
      onDelete: "CASCADE",
    },
    uuid: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      defaultValue: () => nanoid(),
      validate: {
        is: /^[a-z0-9-]{3,30}$/,
      },
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "rhinon.help",
    },
    theme: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        logo: null,
        favicon: null,
        background_image: null,
        primary_color: "#1e3a8a",
        help_center_url: "",
        seo: {
          title: null,
          description: null,
        }
      },
    }
  },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  KnowledgeBase.associate = (models) => {
    KnowledgeBase.belongsTo(models.organizations, {
      foreignKey: "organization_id",
    });
  };

  return KnowledgeBase;
};
