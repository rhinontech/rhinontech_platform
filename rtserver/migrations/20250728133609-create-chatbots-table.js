module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("chatbots", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      chatbot_id: {
        type: Sequelize.STRING(6),
        allowNull: false,
        unique: true,
        validate: {
          len: [6, 6], // Ensures exactly 6 characters
        },
      },
      chatbot_base_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      chatbot_config: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("chatbots");
  },
};
