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
    values: ["mute", "blocked", "snooze"]
  },
  mute_until: {
    type: DataTypes.DATE
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'notification_preferences',
  underscored: true,
  createdAt: 'created_at'
});

NotificationPreference.associate = (models) => {
  NotificationPreference.belongsTo(models.User, { foreignKey: "user_id" });
  NotificationPreference.belongsTo(models.User, { foreignKey: "target_user_id", as: "TargetUser" });
  NotificationPreference.belongsTo(models.Channel, { foreignKey: "channel_id" });
};