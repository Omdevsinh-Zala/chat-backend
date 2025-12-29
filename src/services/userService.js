import { User } from "../models/initModels.js"
import { Op } from "sequelize";
import AppError from "../utils/appError.js";
import { config } from "../config/app.js";

export const getUserData = async (id) => {
    const rawData = await User.findByPk(id);
    if (!rawData) throw new AppError("User not found.", 404);
    const userData = rawData.toJSON();

    if (userData.is_blocked) {
        throw new AppError("Your account has been blocked. Please contact support.", 403);
    }

    return userData;
}

export const updateUserData = async (id, updateUserData) => {
    const updatedUserData = await User.update(updateUserData, {
        where: { id },
        returning: true,
    });
    return updatedUserData;
}

export const getUsers = async (query) => {
    const limit = query.limit || config.pagination.limit;
    const page = query.page || 1;
    const offset = (page - 1) * limit;
    let where = {};
    if (query.search) {
        where = {
            [Op.or]: [
                { first_name: { [Op.iLike]: `%${query.search}%` } },
                { last_name: { [Op.iLike]: `%${query.search}%` } },
            ],
        }
    }
    const { count, rows: rawData } = await User.findAndCountAll({
        where,
        attributes: {
            exclude: ['bio', 'email', 'active_chat_id', 'is_email_verified', 'version', 'last_login', 'created_at', 'deleted_at', 'updated_at']
        },
        limit,
        offset,
        order: [['id', 'DESC']],
    });

    const result = {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        data: rawData.map((user) => user.toJSON()),
    }
    return result;
}