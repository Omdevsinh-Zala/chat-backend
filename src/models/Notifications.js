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
    allowNull: false
  },
  message_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM,
    values: ["message", "mention", "reaction", "invite", "system"],
  },
  title: {
    type: DataTypes.CHAR
  },
  body: {
    type: DataTypes.TEXT
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
  createdAt: 'created_at'
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: "user_id" });
  Notification.belongsTo(models.User, { foreignKey: "sender_id", as: "Sender" });
  Notification.belongsTo(models.Channel, { foreignKey: "channel_id" });
  Notification.belongsTo(models.Message, { foreignKey: "message_id" });
};