module.exports = (sequelize, DataTypes) => {
  const Automation = sequelize.define(
    "automations",
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
      training_url: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      training_pdf: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      training_article: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      is_chatbot_trained: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      training_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'idle',
      },
      training_progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      training_job_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      training_started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      training_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Automation;
};
