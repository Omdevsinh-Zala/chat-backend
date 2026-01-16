import { PushSubscription } from '../models/initModels.js';
import logger from '../config/logger.js';

export const saveSubscription = async (req, res) => {
    try {
        const { subscription, device_id } = req.body;
        const userId = req.user.id;

        if (!subscription) {
            return res.status(400).json({ status: 'error', message: 'Subscription is required' });
        }

        // Check if subscription already exists
        const existing = await PushSubscription.findOne({
            where: {
                user_id: userId,
                subscription: subscription
            }
        });

        if (existing) {
            if (!existing.is_active) {
                await existing.update({ is_active: true });
            }
            return res.status(200).json({ status: 'success', message: 'Subscription already exists' });
        }

        await PushSubscription.create({
            user_id: userId,
            subscription,
            device_id,
            is_active: true
        });

        res.status(201).json({ status: 'success', message: 'Subscription saved' });
    } catch (err) {
        logger.error(`Failed to save push subscription: ${err.message}`);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const deleteSubscription = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        await PushSubscription.update(
            { is_active: false },
            {
                where: {
                    user_id: userId,
                    subscription: subscription
                }
            }
        );

        res.status(200).json({ status: 'success', message: 'Subscription removed' });
    } catch (err) {
        logger.error(`Failed to delete push subscription: ${err.message}`);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
