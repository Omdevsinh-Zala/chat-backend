import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Channel = sequelize.define("Channel", {
  id: {
    type: DataTypes.UUID,
    unique: true,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  title: {
    type: DataTypes.CHAR
  },
  description: {
    type: DataTypes.TEXT
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM,
    values: ["public", "private"],
  },
  admin_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: [],
    comment: 'List of user IDs with admin rights for this channel'
  },
  status: {
    type: DataTypes.ENUM,
    values: ["active", "archived"],
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'channels',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Channel.associate = (models) => {
  Channel.belongsTo(models.User, { foreignKey: "owner_id" });
  Channel.hasMany(models.ChannelMember, { foreignKey: "channel_id" });
  Channel.hasMany(models.Message, { foreignKey: "channel_id" });
};
