module.exports = (sequelize, DataTypes) => {
  const Companies = sequelize.define(
    "companies",
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
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
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
          avatar: { type: "color", value: "#fee2e2", isVisible: true },

          cFundingRaised: { type: "number", value: 0, isVisible: true },
          cLastFundingDate: { type: "date", value: null, isVisible: true },
          cFoundationDate: { type: "date", value: null, isVisible: true },

          addresses: { type: "list:address", value: [], isVisible: true },
          phones: { type: "list:phone", value: [], isVisible: true },
          urls: { type: "list:url", value: [], isVisible: true },
          emails: { type: "list:email", value: [], isVisible: true },

          notes: { type: "longtext", value: "", isVisible: true },

          groups: { type: "list", value: [], isVisible: true },

          createdAtField: { type: "date", value: null, isVisible: true },
          createdByField: { type: "text", value: "", isVisible: true },

          addedToGroupAt: { type: "date", value: null, isVisible: true },
          addedToGroupBy: { type: "text", value: "", isVisible: true },
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
      tableName: "companies",
    }
  );

  return Companies;
};
