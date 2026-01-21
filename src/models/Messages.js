import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  channel_id: {
    type: DataTypes.UUID
  },
  receiver_id: {
    type: DataTypes.UUID
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: ["sending", "sent", "delivered", "read", "failed"],
    defaultValue: "sending"
  },
  message_type: {
    type: DataTypes.ENUM,
    values: ["text", "file", "system", "mixed"],
    allowNull: true,
    defaultValue: null
  },
  reply_to: {
    type: DataTypes.UUID,
    allowNull: true
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reactions: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'messages',
  underscored: true,
  createdAt: 'created_at',
  indexes: [
    { fields: ['channel_id'] },
    { fields: ['sender_id'] },
    { fields: ['receiver_id'] },
    { fields: ['created_at'] },
    { fields: ['sender_id', 'receiver_id', 'created_at'] }
  ]
});

Message.associate = (models) => {
  Message.belongsTo(models.User, { foreignKey: "sender_id", as: "Sender" });
  Message.belongsTo(models.Channel, { foreignKey: "channel_id" });
  Message.belongsTo(models.User, { foreignKey: "receiver_id", as: "Receiver" });
  Message.hasMany(models.Attachment, { foreignKey: "message_id", as: "attachments" });
};