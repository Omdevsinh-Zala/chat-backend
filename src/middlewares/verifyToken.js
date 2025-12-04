import cookie from "cookie";
import jwt from "jsonwebtoken";
import { config } from "../config/app.js";
import logger from "../config/logger.js";
import AppError from "../utils/appError.js";

export const verifyToken = (req, res, next) => {
  const accessToken = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  if (!accessToken && !refreshToken) {
    return next(new AppError("No tokens provided!", 401));
  }

  jwt.verify(accessToken, config.jwt.access.secret, (error, decoded) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return next(new AppError("Access token has expired.", 401));
      } else if (error.name === "JsonWebTokenError") {
        return next(new AppError("Invalid access token.", 401));
      } else {
        logger.error("Access token verification error:", error);
        return next(new AppError("Internal server error during token verification.", 500));
      }
    }
    req.user = decoded;
    return next();
  });
};

export const verifySocketToken = (socket, next) => {
  const cookies = cookie.parse(socket.handshake?.headers?.cookie || "");
  const accessToken = cookies?.access_token;
  const refreshToken = cookies?.refresh_token;

  if (!accessToken && !refreshToken) {
    return next(new AppError("No tokens provided!", 401));
  }

  jwt.verify(accessToken, config.jwt.access.secret, (error, decoded) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return next(new AppError("Access token has expired.", 401));
      } else if (error.name === "JsonWebTokenError") {
        return next(new AppError("Invalid access token.", 401));
      } else {
        logger.error("Access token verification error:", error);
        return next(new AppError("Internal server error during token verification.", 500));
      }
    }
    socket.user = decoded;
    return next();
  });
};
