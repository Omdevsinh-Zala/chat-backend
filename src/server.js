import server from "./app.js";
import { sequelize } from "./models/index.js";
import { config } from "./config/app.js";
import logger from "./config/logger.js";

console.log("Starting server.js..."); // Raw console log for debugging

import { b2 } from "./config/b2.js";

process.on("uncaughtException", (error) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(error.name, error.message, error.stack);

  process.exit(1);
});

let app;

process.on("unhandledRejection", (error) => {
  console.log(error)
  logger.error("UNHANDLED REJECTION! Shutting down...");
  logger.error(error.name, error.message, error.stack);

  app?.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM RECEIVED. Shutting down gracefully...");

  app?.close(() => {
    logger.info("Process terminated.");
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT RECEIVED. Shutting down gracefully...");

  app?.close(() => {
    logger.info("Process terminated.");
  });
});

try {
  await sequelize.authenticate();
  await b2.authorize();
  app = server.listen(config.port || 5002, () => {
    logger.info(`Server running in ${config.env} on port ${config.port}`);
  });
} catch (error) {
  console.log(error)
  console.error("CRITICAL ERROR STARTING SERVER:", error); // Raw console error
  logger.error("Error connecting to database:", error.message);
  logger.error(error.stack);
  process.exit(1);
}