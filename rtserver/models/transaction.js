module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "transactions",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "organizations", // foreign key to organizations
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "users", // foreign key to organizations
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      subscription_tier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscription_cycle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payment_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Transaction;
};
