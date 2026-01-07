const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  development: {
    username: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOST,
    port: process.env.DEV_DB_PORT,
    dialect: process.env.DEV_DB_DIALECT,
    logging: false,
  },
  stage: {
    username: process.env.STAGE_DB_USER,
    password: process.env.STAGE_DB_PASSWORD,
    database: process.env.STAGE_DB_NAME,
    host: process.env.STAGE_DB_HOST,
    port: process.env.STAGE_DB_PORT,
    dialect: process.env.STAGE_DB_DIALECT,
    logging: false,
  },
  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT,
    dialect: process.env.PROD_DB_DIALECT,
    logging: false,
  },
};