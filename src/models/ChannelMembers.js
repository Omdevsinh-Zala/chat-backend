import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
// // import { User } from "./User.js";
// import { Channel } from "./channels.js";

export const ChannelMember = sequelize.define("ChannelMember", {
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM,
    values: ["member", "admin", "owner"],
    allowNull: false,
    defaultValue: "member",
    comment: 'Role of the user in the channel'
  },
  is_muted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mute_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  joined_at: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  invite_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  left_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ban_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  custom_data: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  last_read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'channel_members',
  underscored: true,
  createdAt: 'created_at',
  indexes: [
    { fields: ['channel_id'] },
    { fields: ['user_id'] }
  ]
});

ChannelMember.associate = (models) => {
  ChannelMember.belongsTo(models.User, { foreignKey: "user_id" });
  ChannelMember.belongsTo(models.Channel, { foreignKey: "channel_id" });
};
