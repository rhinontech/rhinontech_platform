module.exports = (sequelize, DataTypes) => {
  const History = sequelize.define(
    "pipeline_stage_histories",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      pipeline_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      entity_type: {
        type: DataTypes.STRING,
        allowNull: false,
      }, // company/people/deal

      from_stage_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      to_stage_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      moved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      moved_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      duration_in_stage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return History;
};
