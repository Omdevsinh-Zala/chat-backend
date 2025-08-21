// src/models/index.js
import { Sequelize } from "sequelize";
import { config } from "../config/app.js";
import * as configFile from "../config/db.cjs";

const configs = configFile.default[config.env || "development"];

export const sequelize = new Sequelize(
  configs.database,
  configs.username,
  configs.password,
  configs
);