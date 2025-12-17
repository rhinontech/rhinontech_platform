module.exports = (sequelize, DataTypes) => {
    const Task = sequelize.define(
        "tasks",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            task_id: {
                type: DataTypes.STRING,
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
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "in-progress",
            },
            priority: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "medium",
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "task",
            },
            assignee_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            reporter_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "SET NULL",
                onDelete: "SET NULL",
            },
            due_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            estimated_hours: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            actual_hours: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            tags: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },
            attachments: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            parent_task_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "tasks",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            comments: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            activities: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["task_id", "organization_id"],
                    name: "unique_task_id_per_organization",
                },
            ],
        }
    );

    return Task;
};
