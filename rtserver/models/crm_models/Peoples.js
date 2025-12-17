module.exports = (sequelize, DataTypes) => {
  const People = sequelize.define(
    "peoples",
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
      full_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emails: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true,
      },
      phones: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      job_title: {
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

          pGender: { type: "text", value: "", isVisible: true },
          pBirthday: { type: "date", value: null, isVisible: true },

          groups: { type: "list", value: [], isVisible: true },

          totalInteractions: { type: "number", value: 0, isVisible: true },
          lastInteraction: { type: "date", value: null, isVisible: true },
          lastNetworkInteractionDate: {
            type: "date",
            value: null,
            isVisible: true,
          },
          lastNetworkInteractionBy: {
            type: "list",
            value: [],
            isVisible: true,
          },

          addresses: { type: "list:address", value: [], isVisible: true },
          urls: { type: "list:url", value: [], isVisible: true },

          companies: { type: "list:company", value: [], isVisible: true },

          notes: { type: "longtext", value: "", isVisible: true },

          createdAtField: { type: "date", value: null, isVisible: true },
          createdByField: { type: "text", value: "", isVisible: true },

          addedToGroupAt: { type: "date", value: null, isVisible: true },
          addedToGroupBy: { type: "text", value: "", isVisible: true },
        },
      },

      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return People;
};
