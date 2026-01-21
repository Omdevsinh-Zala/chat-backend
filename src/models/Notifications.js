import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  channel_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  message_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM,
    values: ["message", "mention", "reaction", "invite", "system", "reminder", "alert"],
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  device_type: {
    type: DataTypes.ENUM,
    values: ["web", "mobile", "desktop"],
    allowNull: true
  },
  is_delivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM,
    values: ["low", "normal", "high"],
    defaultValue: "normal"
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isUrl: true }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'notifications',
  underscored: true,
  createdAt: 'created_at',
  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['expires_at'] }
  ]
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: "user_id" });
  Notification.belongsTo(models.User, { foreignKey: "sender_id", as: "Sender" });
  Notification.belongsTo(models.Channel, { foreignKey: "channel_id" });
  Notification.belongsTo(models.Message, { foreignKey: "message_id" });
};