const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const TeamsMessage = sequelize.define(
        "teams_messages",
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
            },
            scope_type: {
                type: DataTypes.ENUM("channel", "dm"),
                allowNull: false,
            },
            scope_id: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "Channel ID for channels, or dm:{userId1}:{userId2} for DMs",
            },
            sender_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "teams_messages",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return TeamsMessage;
};
