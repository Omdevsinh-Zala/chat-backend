import jwt from "jsonwebtoken";
import { config } from "../config/app.js";

export const generateToken = (payload, type) => {
    return jwt.sign(payload, config.jwt[type].secret, {
        expiresIn: config.jwt[type].expire
    })
}