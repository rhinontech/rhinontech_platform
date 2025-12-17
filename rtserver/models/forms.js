"use strict";
module.exports = (sequelize, DataTypes) => {
  const Form = sequelize.define(
    "forms",
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
        type: DataTypes.STRING,
        allowNull: false,
      },
      ticket_form: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      pre_chat_form: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      post_chat_form: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Form;
};
