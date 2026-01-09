import * as UserService from '../services/userService.js';
import { successResponse } from '../utils/response.js';

export const show = async (req, res, next) => {
    try {
        const userData = await UserService.getUserData(req.user.id);
        return successResponse({ res, data: userData, message: "Data retrieved successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const update = async (req, res, next) => {
    try {
        const updatedUserData = await UserService.updateUserData(req.user.id, req.body);
        return successResponse({ res, data: updatedUserData, message: "Data updated successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getUsers = async (req, res, next) => {
    try {
        const users = await UserService.getUsers(req.query);
        return successResponse({ res, data: users, message: "Data retrieved successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getAllFiles = async (req, res, next) => {
    try {
        const files = await UserService.getAllFiles(req.user.id, req.query);
        return successResponse({ res, data: files, message: "Data retrieved successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const createChannel = async (req, res, next) => {
    try {
        const isChannelCreated = await UserService.createChannel(req.user.id, req.body);
        return successResponse({ res, data: isChannelCreated, message: "Channel created successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getChannelData = async (req, res, next) => {
    try {
        const channelData = await UserService.getChannelData(req.user.id, req.params.id);
        return successResponse({ res, data: channelData, message: "Data retrieved successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getAllChannels = async (req, res, next) => {
    try {
        const channels = await UserService.getAllChannels(req.user.id, req.query);
        return successResponse({ res, data: channels, message: "Data retrieved successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const joinChannel = async (req, res, next) => {
    try {
        const isChannelJoined = await UserService.joinChannel(req.user.id, req.body);
        return successResponse({ res, data: isChannelJoined, message: "Channel joined successfully.", statusCode: 200 });
    } catch (err) {
        next(err);
    }
}