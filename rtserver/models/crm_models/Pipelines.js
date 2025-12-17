module.exports = (sequelize, DataTypes) => {
  const Pipeline = sequelize.define(
    "pipelines",
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

      view_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      pipeline_manage_type: {
        type: DataTypes.STRING,
        allowNull: false, // company / people / deal
      },

      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      stages: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Pipeline;
};
