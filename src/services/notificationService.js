import webpush from 'web-push';
import { Notification, NotificationPreference, PushSubscription, User } from '../models/initModels.js';
import logger from '../config/logger.js';
import { config } from '../config/app.js';

const supportEmail = config.support_email;
const vapidPublicKey = config.VAPID_PUBLIC_KEY;
const vapidPrivateKey = config.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        supportEmail,
        vapidPublicKey,
        vapidPrivateKey
    );
}

export const createAndSendNotification = async ({
    userId,
    senderId,
    title,
    body,
    type,
    channelId = null,
    messageId = null,
    url = null
}) => {
    try {
        // 1. Check Preferences
        const preference = await NotificationPreference.findOne({
            where: {
                user_id: userId,
                channel_id: channelId,
                is_active: true
            }
        });

        if (preference && preference.type === 'mute' && (!preference.mute_until || preference.mute_until > new Date())) {
            logger.info(`Notification muted for user ${userId}`);
            return;
        }

        // 2. Create Database Notification
        await Notification.create({
            user_id: userId,
            sender_id: senderId,
            channel_id: channelId,
            message_id: messageId,
            type,
            title,
            body,
            url,
            is_delivered: true
        });

        const user = await User.findByPk(userId);

        // 3. Send Web Push
        const subscriptions = await PushSubscription.findAll({
            where: { user_id: userId, is_active: true }
        });

        const payload = JSON.stringify({
            notification: {
                title,
                body,
                icon: user.toJSON().avatar_url,
                data: { url }
            }
        });

        const pushPromises = subscriptions.map(sub =>
            webpush.sendNotification(sub.subscription, payload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        logger.warn(`Push subscription expired or not found, removing: ${sub.id}`);
                        return PushSubscription.update({ is_active: false }, { where: { id: sub.id } });
                    }
                    logger.error(`Error sending push notification: ${err}`);
                })
        );

        await Promise.all(pushPromises);

        return true;
    } catch (err) {
        logger.error(`Failed to create or send notification: ${err.message}`);
        return false;
    }
};
