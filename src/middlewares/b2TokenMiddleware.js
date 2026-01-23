import jwt from "jsonwebtoken";
import { config } from "../config/app.js";
import { b2AuthToken, b2ProfileToken } from "../services/tokenService.js";

export const b2TokenMiddleware = (req, res, next) => {
  const accessToken = req.cookies?.access_token;

  jwt.verify(accessToken, config.jwt.access.secret, async (error, decoded) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiresAt = decoded.exp;
    const timeRemaining = expiresAt - currentTime;
    req.b2AuthToken = await b2AuthToken('', timeRemaining);
    req.b2ProfileToken = await b2ProfileToken(timeRemaining);
    return next();
  });
};