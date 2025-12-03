import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import * as LoginService from "../services/authService.js";
import { generateToken } from "../services/tokenService.js";
import { response } from "../services/response.js";
import { sequelize } from "../models/index.js";
import { config } from "../config/app.js";

export const registerUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { privateKey } = await LoginService.registerUser(req.body, t);

        await t.commit();
        const resp = response(true, { privateKey }, "User registered successfully.")
        return res.status(201).json(resp);
    } catch(err) {
        await t.rollback();

        logger.error(err.message)
        let message = err.message
        if(err.name === "SequelizeUniqueConstraintError") {
            message = err.errors[0].path + ' is already taken.'
        }

        const resp = response(false, null, message);
        return res.status(400).json(resp)
    }
}

export const loginUser = async(req, res) => {
    try {
        const { userData, accessToken, refreshToken } =  await LoginService.loginUser(req.body, res);

        const resp = response(true, userData, "Login successful.");
        return res.status(200).cookie('access_token', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000
        })
        .cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 3600000
        }).json(resp)
    } catch(err) {
        logger.error(err.message)
        let message = err.message
        const resp = response(false, null, message);
        return res.status(400).json(resp)
    }
}

export const refreshToken = (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).send("No refresh token");

    jwt.verify(refreshToken, config.jwt.refresh.secret, (err, decoded) => {
        if (err) return res.status(403).send("Invalid refresh token");

        const newAccessToken = generateToken({ id: decoded.id, email: decoded.email }, "access");

        res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 1000 * 60 * 15
        });

        return res.json({ message: "Access token refreshed" });
    });
}

export const logoutUser = async (req, res) => {
    await LoginService.logoutUser(res);
    const resp = response(true, null, "Logout successful.");
    return res.status(200).json(resp);
}