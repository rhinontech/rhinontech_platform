module.exports = (sequelize, DataTypes) => {
  const View = sequelize.define(
    "views",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      group_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "groups",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
      },
      view_manage_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      view_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      view_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      table_columns: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
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
  return View;
};
