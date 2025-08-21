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
  },
  is_muted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mute_until: {
    type: DataTypes.DATE
  },
  joined_at: {
    allowNull: false,
    type: DataTypes.DATE
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'channel_members',
  underscored: true,
  createdAt: 'created_at'
});

ChannelMember.associate = (models) => {
  ChannelMember.belongsTo(models.User, { foreignKey: "user_id" });
  ChannelMember.belongsTo(models.Channel, { foreignKey: "channel_id" });
};
