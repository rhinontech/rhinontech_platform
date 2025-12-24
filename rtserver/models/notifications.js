"use strict";
module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define(
        "notifications",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
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
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            data: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: "unread",
                allowNull: false,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    Notification.associate = function (models) {
        Notification.belongsTo(models.organizations, {
            foreignKey: "organization_id",
            as: "organization",
        });
    };

    return Notification;
};
