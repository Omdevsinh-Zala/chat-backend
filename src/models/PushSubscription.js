import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const PushSubscription = sequelize.define("PushSubscription", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    subscription: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    device_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
    tableName: 'push_subscriptions',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

PushSubscription.associate = (models) => {
    PushSubscription.belongsTo(models.User, { foreignKey: "user_id" });
};
