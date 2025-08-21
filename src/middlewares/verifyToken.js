import cookie from "cookie";
import jwt from "jsonwebtoken";
import { config } from "../config/app.js";

export const verifyToken = (socket, next) => {
    try {
        const cookies = cookie.parse(socket.handshake?.headers?.cookie || "");
        const accessToken = cookies?.access_token;
        const refreshToken = cookies?.refresh_token;
        console.log(accessToken)
        console.log(refreshToken)
      
        if (!accessToken && !refreshToken) {
          return next(new Error("No tokens provided!"));
        }
      
        jwt.verify(accessToken, config.jwt.access.secret, (err) => {
          if (err) {
            // access expired -> verify refresh
            jwt.verify(refreshToken, config.jwt.refresh.secret, (refreshErr) => {
              if (refreshErr) {
                return next(new Error("Authentication failed, login again"));
              }
      
              return next(new Error("Access expired, please refresh token via /auth/refresh"));
            });
          } else {
            return next();
          }
        });
    } catch(err) {
        console.log(err)
    }
};
