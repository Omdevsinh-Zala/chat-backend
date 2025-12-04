import { User } from "../models/User.js"
import AppError from "../utils/appError.js";

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