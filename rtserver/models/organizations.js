module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    "organizations",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      organization_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // subscription_tier: {
      //   type: DataTypes.STRING,
      //   defaultValue: "Trial",
      // },
      // subscription_start_date: DataTypes.DATE,
      // subscription_end_date: DataTypes.DATE,
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Organization;
};
