import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import { genSalt, hash } from "bcrypt";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4,
  },
  full_name: {
    type: DataTypes.VIRTUAL,
    get() {
      return [this.first_name, this.last_name].join(' ');
    }
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: true,
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  providers: {
    type: DataTypes.JSON,
    defaultValue: ["email"]
  },
  login_provider: {
    type: DataTypes.ENUM,
    values: ["email", "google", "github", "x"],
    defaultValue: "email"
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  public_key: {
    type: DataTypes.STRING,
    allowNull: false
  },
},
{
  timestamps: true,
  paranoid: true,
  version: true,
  tableName: 'users',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  hooks: {
    beforeCreate: async (user) => {
      const salt = await genSalt(5);
      const hashPass = await hash(user.password, salt);
      user.password = hashPass;
    },
    beforeUpdate: async (user) => {
      if (user.changed("password")) {
        const salt = await genSalt(5);
        const hashPass = await hash(user.password, salt);
        user.password = hashPass;
      }
    }
  }
});

User.associate = (models) => {
  User.hasMany(models.Message, { foreignKey: "sender_id" });
  User.hasMany(models.Notification, { foreignKey: "user_id" });
  User.hasMany(models.Channel, { foreignKey: "owner_id" });
  User.hasMany(models.ChannelMember, { foreignKey: "user_id" });
  User.hasMany(models.NotificationPreference, { foreignKey: "user_id" });
  User.hasOne(models.Setting, { foreignKey: "user_id" });
}