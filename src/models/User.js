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
  // public_key: {
  //   type: DataTypes.TEXT,
  //   allowNull: false,
  //   comment: 'Public key for end-to-end encryption (generated client-side)'
  // },
  active_chat_id: {
    type: DataTypes.UUID,
    allowNull: true
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
        if (!user.active_chat_id) {
          user.active_chat_id = user.id;
        }
        const salt = await genSalt(config.saltRounds);
        const hashPass = await hash(user.password, salt);
        user.password = hashPass;
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await genSalt(config.saltRounds);
          const hashPass = await hash(user.password, salt);
          user.password = hashPass;
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
  User.hasMany(models.Message, { foreignKey: "sender_id", as: "SentMessages" });
  User.hasMany(models.Notification, { foreignKey: "user_id" });
  User.hasMany(models.ChannelMember, { foreignKey: "user_id" });
  User.hasMany(models.NotificationPreference, { foreignKey: "user_id" });
  User.hasOne(models.Setting, { foreignKey: "user_id" });
  // Many-to-Many relationship with Channel through ChannelMember
  User.belongsToMany(models.Channel, {
    through: models.ChannelMember,
    foreignKey: "user_id",
    otherKey: "channel_id",
    as: "Channels"
  });
}