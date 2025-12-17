module.exports = (sequelize, DataTypes) => {
    const ChatbotCampaign = sequelize.define(
        "chatbot_campaigns",
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
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "Campaign type: recurring or one-time",
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "draft",
                comment: "Campaign status: active, draft, or paused",
            },
            content: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
                comment: "Campaign content including template, layout, heading, media, buttons",
            },
            targeting: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
                comment: "Targeting rules including visitor type, triggers, and conditions",
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return ChatbotCampaign;
};
