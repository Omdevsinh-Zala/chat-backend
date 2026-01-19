import { Setting } from '../models/initModels.js';
import logger from '../config/logger.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        let settings = await Setting.findOne({
            where: { user_id: userId }
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await Setting.create({
                user_id: userId,
                theme: 'light',
                language: 'english',
                notification_sound: 'default',
                push_enabled: false,
                email_notifications: false
            });
        }

        return successResponse({ res, data: settings, message: null, statusCode: 200 })
    } catch (err) {
        logger.error(`Failed to get user settings: ${err.message}`);
        return errorResponse({ res, message: 'Internal server error', statusCode: 500 })
    }
};

export const updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        let settings = await Setting.findOne({
            where: { user_id: userId }
        });

        if (!settings) {
            settings = await Setting.create({
                user_id: userId,
                ...updates
            });
        } else {
            await settings.update(updates);
        }

        return successResponse({ res, data: settings, message: null, statusCode: 200 });
    } catch (err) {
        logger.error(`Failed to update user settings: ${err.message}`);
        return errorResponse({ res, message: 'Internal server error', statusCode: 500 });
    }
};
