import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const ChannelInvitation = sequelize.define("ChannelInvitation", {
    id: {
        type: DataTypes.UUID,
        unique: true,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    channel_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    inviter_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    tableName: 'channel_invitations',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { unique: true, fields: ['token'] },
        { fields: ['channel_id'] }
    ]
});

ChannelInvitation.associate = (models) => {
    ChannelInvitation.belongsTo(models.Channel, { foreignKey: "channel_id" });
    ChannelInvitation.belongsTo(models.User, { foreignKey: "inviter_id", as: "Inviter" });
};
