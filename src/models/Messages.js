import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

export const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  channel_id: {
    type: DataTypes.UUID
  },
  receiver_id: {
    type: DataTypes.UUID
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM,
    values: ["send", "delivered", "read"],
  }
},{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'messages',
  underscored: true,
  createdAt: 'created_at'
});

Message.associate = (models) => {
  Message.belongsTo(models.User, { foreignKey: "sender_id" });
  Message.belongsTo(models.Channel, { foreignKey: "channel_id" });
  Message.belongsTo(models.User, { foreignKey: "receiver_id", as: "Receiver" });
};