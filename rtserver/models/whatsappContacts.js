module.exports = (sequelize, DataTypes) => {
    const WhatsAppContact = sequelize.define(
        "whatsapp_contacts",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            account_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "whatsapp_accounts",
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
            // Contact Info
            phone_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            profile_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            // Status
            is_blocked: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            last_message_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                { fields: ["account_id"] },
                { fields: ["organization_id"] },
                { fields: ["phone_number"] },
                {
                    unique: true,
                    fields: ["account_id", "phone_number"],
                    name: "unique_account_phone",
                },
            ],
        }
    );

    return WhatsAppContact;
};
