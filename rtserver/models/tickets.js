"use strict";
module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define(
    "tickets",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      ticket_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      assigned_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "SET NULL",
        onDelete: "SET NULL",
      },
      custom_data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      conversations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      is_new: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Open",
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Medium",
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Ticket;
};
