module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define(
    "groups",
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
      group_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      manage_type: {
        type: DataTypes.STRING,
        allowNull: true,
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
  return Group;
};
