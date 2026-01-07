import logger from "../config/logger.js";
import AppError from "../utils/appError.js";
import { errorResponse } from "../utils/response.js";
import { MulterError } from "multer";

const globalErrorHandler = async (err, req, res, _next) => {
  const stack = err.stack || "";

  if (err instanceof AppError && err.isOperational) {
    const stackLines = stack.split("\n");
    const traceLine = stackLines[1] || "";
    const fallbackMatch = traceLine.match(/at (.*):(\d+):(\d+)/);
    const match = traceLine.match(/\((.*):(\d+):(\d+)\)/) || fallbackMatch;
    const filePath = match?.[1] || "unknown";
    const line = match?.[2] || "unknown";
    const column = match?.[3] || "unknown";

    logger.error(
      `[${req.method}] ${req.originalUrl} | IP: ${req.ip} -> Error Message: ${err.message
      } -> Error Detail: ${typeof err.details === "object"
        ? JSON.stringify(err.details)
        : err.details
      } | File: ${filePath}:${line}:${column}.`
    );

    return errorResponse({
      res,
      message: err.message,
      statusCode: err.status || 500,
      details: err.details ?? null,
    });
  }

  logger.error(
    `[${req.method}] ${req.originalUrl} | IP: ${req.ip} -> ${err.message}\n${stack}`
  );

  if (err instanceof MulterError) {
    let multerError = "Error uploading files.";
    if (err.code === "LIMIT_FILE_SIZE") {
      multerError = "File size exceeds the limit.";
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      multerError = "Too many files uploaded.";
    }
    return errorResponse({
      res,
      message: multerError,
      statusCode: err.statusCode || 500,
      details: multerError,
    });
  }

  return errorResponse({
    res,
    message: "An unexpected error occurred. Please contact the administrator.",
    statusCode: err.statusCode || err.status || 500,
    details: null,
  });
};

export default globalErrorHandler;
