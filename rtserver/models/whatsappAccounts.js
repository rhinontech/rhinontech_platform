module.exports = (sequelize, DataTypes) => {
    const WhatsAppAccount = sequelize.define(
        "whatsapp_accounts",
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
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            // WhatsApp Business Account Details
            phone_number_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            waba_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            business_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            display_phone_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            verified_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            quality_rating: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            // Access Token (encrypted)
            access_token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            token_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "Bearer",
            },
            token_expires_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            // Status
            status: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "active", // active, disconnected, expired
            },
            is_default: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            // Metadata
            last_sync_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                { fields: ["organization_id"] },
                { fields: ["user_id"] },
                { fields: ["phone_number_id"] },
                { fields: ["status"] },
            ],
        }
    );

    return WhatsAppAccount;
};
