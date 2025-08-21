import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Setting = sequelize.define("Setting", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  theme: {
    type: DataTypes.ENUM,
    values: ["light", "dark"],
    defaultValue: "light"
  },
  language: {
    type: DataTypes.CHAR,
    allowNull: false,
    defaultValue: "english"
  },
  notification_sound: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  push_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'settings',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

Setting.associate = (models) => {
  Setting.belongsTo(models.User, { foreignKey: "user_id" });
};

