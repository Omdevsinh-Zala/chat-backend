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
    allowNull: false,
    unique: true
  },
  theme: {
    type: DataTypes.ENUM,
    values: ["light", "dark", "system"],
    defaultValue: "light"
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "english",
    validate: {
      isIn: [["english", "spanish", "french", "german", "hindi", "chinese", "japanese"]]
    }
  },
  notification_sound: {
    type: DataTypes.ENUM,
    values: ["default", "chime", "ding", "sciClick", "beep", "none"],
    defaultValue: "default"
  },
  push_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  mat_theme: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'azure-theme'
  }
}, {
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

