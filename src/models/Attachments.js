import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Attachment = sequelize.define("Attachment", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4
    },
    message_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    sender_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    receiver_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    file_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mime_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    thumbnail_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    paranoid: true,
    version: true,
    tableName: 'attachments',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
});

Attachment.associate = (models) => {
    Attachment.belongsTo(models.Message, { foreignKey: "message_id" });
    Attachment.belongsTo(models.User, { foreignKey: "sender_id", as: "Sender" });
    Attachment.belongsTo(models.User, { foreignKey: "receiver_id", as: "Receiver" });
};
