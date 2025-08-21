import winston from "winston";

const fileTransport = new winston.transports.File({
  filename: "application.log",
  format: winston.format.combine(
    winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
});

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [fileTransport],
});

export default logger;