import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const NotificationPreference = sequelize.define("NotificationPreference", {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  target_user_id: {
    type: DataTypes.UUID
  },
  channel_id: {
    type: DataTypes.UUID
  },
  type: {
    type: DataTypes.ENUM,
    values: ["mute", "blocked", "snooze", "important", "custom"],
    allowNull: false
  },
  mute_until: {
    type: DataTypes.DATE
  },
  preference_level: {
    type: DataTypes.ENUM,
    values: ["low", "normal", "high"],
    defaultValue: "normal"
  },
  reason: {
    type: DataTypes.STRING(128),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'notification_preferences',
  underscored: true,
  createdAt: 'created_at',
  indexes: [
    { fields: ['user_id', 'channel_id', 'type'], unique: true },
    { fields: ['user_id'] },
    { fields: ['channel_id'] }
  ]
});

NotificationPreference.associate = (models) => {
  NotificationPreference.belongsTo(models.User, { foreignKey: "user_id" });
  NotificationPreference.belongsTo(models.User, { foreignKey: "target_user_id", as: "TargetUser" });
  NotificationPreference.belongsTo(models.Channel, { foreignKey: "channel_id" });
};