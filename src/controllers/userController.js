import * as UserService from '../services/userService.js';
import { successResponse } from '../utils/response.js';

export const show = async (req, res, next) => {
    try {
        const userData = await UserService.getUserData(req.user.id);
        return successResponse({res, data: userData, message: "Data retrieved successfully.", statusCode: 200});
    } catch(err) {
        next(err);
    } 
}

export const update = async (req, res, next) => {
    try {
        const updatedUserData = await UserService.updateUserData(req.user.id, req.body);
        return successResponse({res, data: updatedUserData, message: "Data updated successfully.", statusCode: 200});
    } catch(err) {
        next(err);
    }
}

export const getUsers = async (req, res, next) => {
    try {
        const users = await UserService.getUsers(req.query);
        return successResponse({res, data: users, message: "Data retrieved successfully.", statusCode: 200});
    } catch(err) {
        next(err);
    }
}

export const getAllFiles = async (req, res, next) => {
    try {
        const files = await UserService.getAllFiles(req.user.id, req.query);
        return successResponse({res, data: files, message: "Data retrieved successfully.", statusCode: 200});
    } catch(err) {
        next(err);
    }
}