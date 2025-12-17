module.exports = (sequelize, DataTypes) => {
    const WhatsAppMessage = sequelize.define(
        "whatsapp_messages",
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
            // Message Identifiers
            message_id: {
                type: DataTypes.STRING(255),
                allowNull: true,
                unique: true,
            },
            wamid: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            // Participants
            from_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            to_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            direction: {
                type: DataTypes.STRING(20),
                allowNull: false, // 'inbound', 'outbound'
            },
            // Message Content
            message_type: {
                type: DataTypes.STRING(50),
                allowNull: false, // 'text', 'image', 'document', 'audio', 'video', 'template'
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            media_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            media_mime_type: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            caption: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            // Template (for outbound template messages)
            template_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            template_language: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            template_params: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            // Status Tracking
            status: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "pending", // pending, sent, delivered, read, failed
            },
            error_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            error_message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            // Timestamps
            sent_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            delivered_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            read_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            // Conversation Context
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            contact_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            // Metadata
            metadata: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false, // Only created_at, no updated_at
            indexes: [
                { fields: ["account_id"] },
                { fields: ["organization_id"] },
                { fields: ["message_id"] },
                { fields: ["from_number"] },
                { fields: ["to_number"] },
                { fields: ["direction"] },
                { fields: ["status"] },
                { fields: ["created_at"] },
                { fields: ["conversation_id"] },
            ],
        }
    );

    return WhatsAppMessage;
};
