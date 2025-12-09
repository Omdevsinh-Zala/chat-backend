import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import { genSalt, hash } from "bcrypt";
import { config } from "../config/app.js";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: true,
      notEmpty: true,
      len: [3, 32],
      is: /^[a-zA-Z0-9_]+$/i
    }
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
      notNull: true,
      notEmpty: true,
      isEmail: true,
      len: [5, 128]
    }
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  bio: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
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
    defaultValue: false
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
    type: DataTypes.TEXT,
    allowNull: false
  },
  private_key: {
    type: DataTypes.TEXT,
    allowNull: false,
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
      const salt = await genSalt(config.saltRounds);
      const hashPass = await hash(user.password, salt);
      user.password = hashPass;

      const crypto = await import('crypto');
      const key = crypto.pbkdf2Sync(
        user.password,
        salt,
        config.pbkdf2.iterations,
        config.pbkdf2.keylen,
        config.pbkdf2.digest
      );
      const iv = crypto.randomBytes(config.aes.iv);
      const cipher = crypto.createCipheriv(config.aes.algorithm, key, iv);
      let encrypted = cipher.update(user.private_key, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      user.private_key = iv.toString('base64') + ':' + encrypted;
    },
    beforeUpdate: async (user) => {
      if (user.changed("password")) {
        const salt = await genSalt(config.saltRounds);
        const hashPass = await hash(user.password, salt);
        user.password = hashPass;

        const crypto = await import('crypto');
        const key = crypto.pbkdf2Sync(
          user.password,
          salt,
          config.pbkdf2.iterations,
          config.pbkdf2.keylen,
          config.pbkdf2.digest
        );
        const iv = crypto.randomBytes(config.aes.iv);
        const cipher = crypto.createCipheriv(config.aes.algorithm, key, iv);
        let encrypted = cipher.update(user.private_key, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        user.private_key = iv.toString('base64') + ':' + encrypted;
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password', 'providers', 'login_provider', 'is_blocked'] }
  },
}
);

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.providers;
  delete values.login_provider;
  delete values.is_blocked;
  return values;
};

User.associate = (models) => {
  User.hasMany(models.Message, { foreignKey: "sender_id" });
  User.hasMany(models.Notification, { foreignKey: "user_id" });
  User.hasMany(models.Channel, { foreignKey: "owner_id" });
  User.hasMany(models.ChannelMember, { foreignKey: "user_id" });
  User.hasMany(models.NotificationPreference, { foreignKey: "user_id" });
  User.hasOne(models.Setting, { foreignKey: "user_id" });
}