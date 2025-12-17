module.exports = (sequelize, DataTypes) => {
  const Deal = sequelize.define(
    "deals",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      contact_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true,
      },

      custom_fields: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
          avatar: { type: "color", value: "#dbeafe", isVisible: true },

          dealValue: { type: "number", value: 0, isVisible: true },
          priority: {
            type: "select",
            value: "Medium",
            options: ["Low", "Medium", "High", "Critical"],
            isVisible: true,
          },
          probability: { type: "number", value: 0, isVisible: true },

          currency: { type: "text", value: "USD", isVisible: true },
          source: { type: "text", value: "", isVisible: true },

          channels: {
            type: "multi-select",
            value: [],
            options: [],
            isVisible: true,
          },

          lastActivityAt: { type: "date", value: null, isVisible: true },
          nextFollowupAt: { type: "date", value: null, isVisible: true },

          notes: { type: "longtext", value: "", isVisible: true },

          createdAtField: { type: "date", value: null, isVisible: true },
          createdByField: { type: "text", value: "", isVisible: true },
        },
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Deal;
};
