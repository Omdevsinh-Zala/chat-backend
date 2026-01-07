import { User } from "./User.js";
import { Channel } from "./Channels.js";
import { ChannelMember } from "./ChannelMembers.js";
import { Message } from "./Messages.js";
import { Notification } from "./Notifications.js";
import { NotificationPreference } from "./NotificationPreferences.js";
import { Setting } from "./Settings.js";
import { Attachment } from "./Attachments.js";

// Create models object
const models = {
    User,
    Channel,
    ChannelMember,
    Message,
    Notification,
    NotificationPreference,
    Setting,
    Attachment
};

// Initialize associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// Export all models with associations initialized
export { User, Channel, ChannelMember, Message, Notification, NotificationPreference, Setting, Attachment };
