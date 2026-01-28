module.exports = (sequelize, DataTypes) => {
    const SeedDataRegistry = sequelize.define(
        'seed_data_registry',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            table_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                comment: 'Name of the table containing the seed record'
            },
            record_id: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'ID of the seed data record (supports both INTEGER and UUID)'
            },
            organization_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'Organization that owns this seed data'
            }
        },
        {
            tableName: 'seed_data_registry',
            timestamps: true,
            underscored: true
        }
    );

    return SeedDataRegistry;
};
