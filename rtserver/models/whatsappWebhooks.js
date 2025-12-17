module.exports = (sequelize, DataTypes) => {
    const WhatsAppWebhook = sequelize.define(
        "whatsapp_webhooks",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            account_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "whatsapp_accounts",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            organization_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "organizations",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            // Webhook Data
            event_type: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            payload: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            // Processing
            processed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            processed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            error: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false, // Only created_at
            indexes: [
                { fields: ["account_id"] },
                { fields: ["organization_id"] },
                { fields: ["event_type"] },
                { fields: ["processed"] },
                { fields: ["created_at"] },
            ],
        }
    );

    return WhatsAppWebhook;
};
