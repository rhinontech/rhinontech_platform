module.exports = (sequelize, DataTypes) => {
  const Chatbot = sequelize.define(
    "chatbots",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      chatbot_id: {
        type: DataTypes.STRING(6),
        allowNull: false,
        unique: true,
        validate: {
          len: [6, 6], // Ensures exactly 6 characters
        },
      },
      chatbot_base_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      api_key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      chatbot_config: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Chatbot;
};
