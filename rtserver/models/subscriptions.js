module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "subscriptions",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      subscription_cycle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscription_tier: {
        type: DataTypes.STRING,
        defaultValue: "Trial",
      },
      subscription_start_date: DataTypes.DATE,
      subscription_end_date: DataTypes.DATE,
      seo_performance_trigger_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      seo_compliance_trigger_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Subscription;
};
