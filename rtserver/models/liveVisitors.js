module.exports = (sequelize, DataTypes) => {
  const LiveVisitor = sequelize.define(
    "live_visitors",
    {
      chatbot_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      visitor_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      visitor_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      room: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      socket_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      region: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      last_seen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return LiveVisitor;
};
