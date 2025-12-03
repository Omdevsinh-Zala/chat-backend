import { compare } from "bcrypt";
import { User } from "../models/User.js";
import { response } from "./response.js";
import { generateToken } from "./tokenService.js";
import { createUserKeys } from "../utils/keyGenerator.js";
import logger from "../config/logger.js";
import { Setting } from "../models/settings.js";

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
        public_key: keys.publicKey
    }, { transaction: t });

    await Setting.create({
        user_id: user.toJSON().id
    }, { transaction: t })

    return { privateKey: keys.privateKey };
}

export const loginUser = async(data, res) => {
    const user = await User.findOne({
        where: {
            email: data.email,
        }
    });
    if(!user) {
        const resp = response(false, null, "Invalid credentials.");
        return res.status(401).json(resp);
    }

    const isCorrectPassword = await compare(data.password, user.toJSON().password);
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

    return { userData, accessToken, refreshToken };
}

export const logoutUser = (res) => {
    return res.status(200).clearCookie('access_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 3600000
        })
        .clearCookie('refresh_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 24 * 3600000
        });
}