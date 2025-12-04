import { compare } from "bcrypt";
import { User } from "../models/User.js";
import { generateToken } from "./tokenService.js";
import { createUserKeys } from "../utils/keyGenerator.js";
import logger from "../config/logger.js";
import { Setting } from "../models/settings.js";
import AppError from "../utils/appError.js";

export const registerUser = async(data, t) => {
    const keys = createUserKeys();
    if(!keys || !keys.publicKey || !keys.privateKey) {
        logger.error("Key pair generation failed.");
        throw new Error("Something went wrong. Please try again later!");
    }

    const user = await User.create({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        public_key: keys.publicKey,
        private_key: keys.privateKey
    }, { transaction: t });

    await Setting.create({
        user_id: user.toJSON().id
    }, { transaction: t })

    return { privateKey: keys.privateKey };
}

export const loginUser = async(data) => {
    const user = await User.findOne({
        where: {
            email: data.email,
        }
    });
    if(!user) {
        throw new AppError("Invalid credentials.", 400);
    }

    const isCorrectPassword = await compare(data.password, user.toJSON().password);
    if(!isCorrectPassword) {
        throw new AppError("Invalid credentials.", 400);
    }

    const accessToken = generateToken({ id: user.toJSON().id, email: user.toJSON().email }, 'access');
    const refreshToken = generateToken({ id: user.toJSON().id, email: user.toJSON().email }, 'refresh');

    const userData = {
        firstName: user.toJSON().first_name,
        lastName: user.toJSON().last_name,
        fullName: user.toJSON().full_name,
        email: user.toJSON().email,
    }

    return { userData, accessToken, refreshToken };
}

export const logoutUser = (res) => {
    return res.status(200).clearCookie('access_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 3600000
    })
    .clearCookie('refresh_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 3600000
    });
}