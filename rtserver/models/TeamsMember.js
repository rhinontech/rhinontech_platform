const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const TeamsMember = sequelize.define(
        "teams_members",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            channel_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            organization_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("admin", "member"),
                allowNull: false,
                defaultValue: "member",
            },
            joined_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "teams_members",
            timestamps: false,
        }
    );

    return TeamsMember;
};
