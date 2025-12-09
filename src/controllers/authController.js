import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import * as LoginService from "../services/authService.js";
import { generateToken } from "../services/tokenService.js";
import { sequelize } from "../models/index.js";
import { config } from "../config/app.js";
import AppError from "../utils/appError.js";
import { successResponse } from "../utils/response.js";

export const registerUser = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        await LoginService.registerUser(req.body, t);

        await t.commit();
        return successResponse({res, data: null, message: "User registered successfully.", statusCode: 201});
    } catch(err) {
        await t.rollback();

        logger.error(err.message)
        let message = err.message
        if(err.name === "SequelizeUniqueConstraintError") {
            message = err.errors[0].path + ' is already taken.'
        }
        next(new AppError(message, 400));
    }
}

export const loginUser = async(req, res, next) => {
    try {
        const { userData, accessToken, refreshToken } =  await LoginService.loginUser(req.body, res);

        res.status(200).cookie('access_token', accessToken, {
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
        });
        return successResponse({res, data: userData, message: "Login successful.", statusCode: 200});
    } catch(err) {
        logger.error(err.message)
        next(err);
    }
}

export const refreshToken = (req, res, next) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(401).send("No refresh token");

    jwt.verify(refreshToken, config.jwt.refresh.secret, (err, decoded) => {
        if (err) return next(new AppError("Invalid refresh token", 403));

        const newAccessToken = generateToken({ id: decoded.id, email: decoded.email }, "access");

        res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 1000 * 60 * 15
        });

        return successResponse({res, data: null, message: "Access token refreshed successfully.", statusCode: 200});
    });
}

export const logoutUser = async (req, res, next) => {
    try {
        const result = await LoginService.logoutUser(res);
        return successResponse({res: result, data: null, message: "Logout successful.", statusCode: 200});
    } catch (err) {
        logger.error(err.message);
        return next(err);
    }
}

export const checkUsername = async (req, res, next) => {
    try {
        const { username } = req.query;
        const user = await LoginService.checkUsername(username);
        const isAvailable = !user;
        return successResponse({res, data: { isAvailable }, message: "Username availability checked successfully.", statusCode: 200});
    } catch (err) {
        logger.error(err.message);
        return next(err);
    }
}