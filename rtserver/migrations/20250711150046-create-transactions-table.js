module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      subscription_tier: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subscription_cycle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_amount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      payment_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_order_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_signature: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("transactions");
  },
};
