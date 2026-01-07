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
    type: DataTypes.STRING(128),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isUrl: true }
  },
  topic: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
    values: ["public", "private", "dm", "group", "announcement"],
    defaultValue: "public"
  },
  admin_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: [],
    comment: 'List of user IDs with admin rights for this channel'
  },
  status: {
    type: DataTypes.ENUM,
    values: ["active", "archived", "locked", "deleted"],
    defaultValue: "active"
  }
}, {
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'channels',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['owner_id'] },
    { fields: ['type'] }
  ]
});

Channel.associate = (models) => {
  Channel.hasMany(models.ChannelMember, { foreignKey: "channel_id" });
  Channel.hasMany(models.Message, { foreignKey: "channel_id" });
  // Many-to-Many relationship with User through ChannelMember
  Channel.belongsToMany(models.User, {
    through: models.ChannelMember,
    foreignKey: "channel_id",
    otherKey: "user_id",
    as: "Members"
  });
};
