import { compare } from "bcrypt";
import { User, Setting } from "../models/initModels.js";
import { b2AuthToken, generateToken, b2ProfileToken } from "./tokenService.js";
import AppError from "../utils/appError.js";
import { randomImage } from "../utils/profileImagePicker.js";
import { config } from "../config/app.js";

export const registerUser = async (data, t) => {
    const user = await User.create({
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        avatar_url: randomImage(),
        is_last_active_chat_channel: false,
    }, { transaction: t });

    await Setting.create({
        user_id: user.toJSON().id
    }, { transaction: t })
}

export const loginUser = async (data) => {
    const user = await User.findOne({
        where: {
            email: data.email,
        },
        attributes: ['password', 'email', 'id', 'first_name', 'last_name', 'username', 'active_chat_id'],
    });
    if (!user) {
        throw new AppError("Invalid credentials.", 400);
    }

    const isCorrectPassword = await compare(data.password, user.getDataValue('password'));
    if (!isCorrectPassword) {
        throw new AppError("Invalid credentials.", 400);
    }

    const accessToken = generateToken({ id: user.toJSON().id, email: user.toJSON().email }, 'access');
    const refreshToken = generateToken({ id: user.toJSON().id, email: user.toJSON().email }, 'refresh');

    const userData = user.toJSON();

    const path = [userData.id, userData.active_chat_id].sort().join('-');
    const userPath = `users/${path}`;

    const authToken = await b2AuthToken(userPath, 60 * 60);
    const profileToken = await b2ProfileToken(60 * 60);

    const token = authToken;
    userData.token = token;
    userData.profileToken = profileToken;

    return { userData, accessToken, refreshToken };
}

export const logoutUser = (res) => {
    return res.status(200).clearCookie('access_token', {
        httpOnly: true,
        secure: config.env === 'development' ? false : true,
        sameSite: config.env === 'development' ? 'lax' : 'none',
        maxAge: 3600000
    })
        .clearCookie('refresh_token', {
            httpOnly: true,
            secure: config.env === 'development' ? false : true,
            sameSite: config.env === 'development' ? 'lax' : 'none',
            maxAge: 24 * 3600000
        });
}

export const checkUsername = async (id, username) => {
    const user = await User.findOne({
        where: {
            username: username,
        },
        attributes: ['id', 'username'],
        raw: true,
    });
    return user?.id === id ? user.username === username ? false : true : !!user;
}