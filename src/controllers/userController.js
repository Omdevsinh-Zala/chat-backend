import * as UserService from '../services/userService.js';
import { successResponse } from '../utils/response.js';

export const show = async (req, res, next) => {
    try {
        const userData = await UserService.getUserData(req.user.id, req.b2AuthToken, req.b2ProfileToken);
        return successResponse({ res, data: userData, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const showProfile = async (req, res, next) => {
    try {
        const userData = await UserService.getProfileData(req.params.id);
        return successResponse({ res, data: userData, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const update = async (req, res, next) => {
    try {
        const updatedUserData = await UserService.updateUserData(req.user.id, req.body);
        return successResponse({ res, data: updatedUserData, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const uploadProfileImage = async (req, res, next) => {
    try {
        const id = req.user.id;
        const userData = await UserService.uploadProfileImage(id, req.file);
        return successResponse({ res, data: userData, message: null, statusCode: 201 })
    } catch(err) {
        next(err);
    }
}

export const getUsers = async (req, res, next) => {
    try {
        const users = await UserService.getUsers(req.query);
        return successResponse({ res, data: users, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getAllFiles = async (req, res, next) => {
    try {
        const files = await UserService.getAllFiles(req.user.id, req.query);
        return successResponse({ res, data: files, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const createChannel = async (req, res, next) => {
    try {
        const isChannelCreated = await UserService.createChannel(req.user.id, req.body);
        return successResponse({ res, data: isChannelCreated, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getChannelData = async (req, res, next) => {
    try {
        const channelData = await UserService.getChannelData(req.user.id, req.params.id);
        return successResponse({ res, data: channelData, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}

export const getAllChannels = async (req, res, next) => {
    try {
        const channels = await UserService.getAllChannels(req.user.id, req.query);
        return successResponse({ res, data: channels, message: null, statusCode: 200 });
    } catch (err) {
        next(err);
    }
}