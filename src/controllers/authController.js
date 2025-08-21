import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import logger from "../config/logger.js";
import { createUserKeys } from "../utils/keyGenerator.js";
import { generateToken } from "../services/tokenService.js";
import { response } from "../services/response.js";
import { sequelize } from "../models/index.js";
import { Setting } from "../models/settings.js";
import { config } from "../config/app.js";

export const registerUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const user = await User.create({
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            public_key: createUserKeys().publicKey
        }, { transaction: t });

        await Setting.create({
            user_id: user.toJSON().id
        }, { transaction: t })

        await t.commit();
        const privateKey = createUserKeys().privateKey;
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
        const user = await User.findOne({
            where: {
                email: req.body.email,
            }
        });
        if(!user) {
            const resp = response(false, null, "Invalid credentials.");
            return res.status(401).json(resp);
        }

        const isCorrectPassword = await compare(req.body.password, user.toJSON().password);
        if(!isCorrectPassword) {
            const resp = response(false, null, "Invalid credentials.");
            return res.status(401).json(resp);
        }

        const accessToken = generateToken({ id: user.toJSON().id, email: user.toJSON().email }, 'access');
        const refreshToken = generateToken({ id: user.toJSON().id, email: user.toJSON().email }, 'refresh');

        const userData = {
            firstName: user.toJSON().first_name,
            lastName: user.toJSON().last_name,
            fullName: user.toJSON().full_name,
            email: user.toJSON().email,
        }

        const resp = response(true, userData, "Login successful.");
        return res.status(200).cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 3600000
        })
        .cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
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