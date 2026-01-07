// src/models/index.js
import { Sequelize } from "sequelize";
import { config } from "../config/app.js";
import * as configFile from "../config/db.cjs";

const configs = configFile.default[config.env || "development"];

console.log(configs);

// Create and export sequelize FIRST, before importing any models
export const sequelize = new Sequelize(
  configs.database,
  configs.username,
  configs.password,
  {
    ...configs,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);