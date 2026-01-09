import { config } from "../config/app.js";
import { Channel, Attachment, Message, ChannelMember, User } from "../models/initModels.js";
import logger from "../config/logger.js";
import { v4 as uuidv4 } from 'uuid';

export const userChannels = async (id) => {
  const channels = await Channel.findAll({
    include: [
      {
        model: User,
        as: 'Members',
        where: { id }
      }
    ]
  });
  return channels.map(channel => {
    const plainChannel = channel.toJSON();
    delete plainChannel.Members;
    delete plainChannel.admin_ids;
    delete plainChannel.only_admin_can_message;
    delete plainChannel.owner_id;
    delete plainChannel.status;
    delete plainChannel.updated_at;
    delete plainChannel.updatedAt;
    delete plainChannel.version;
    delete plainChannel.topic;
    delete plainChannel.deletedAt;
    delete plainChannel.description;
    return plainChannel;
  });
}

export const getChannelChatMessages = async (senderId, channelId, offsets) => {
  try {
    const limit = config.pagination.limit || 20;
    const offset = offsets !== null ? offsets : 0;
    const messages = await Message.findAll({
      where: {
        channel_id: channelId
      },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'file_type', 'file_name', 'file_size', 'file_url', 'mime_type', 'created_at']
        },
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'first_name', 'last_name', 'full_name', 'username', 'avatar_url']
        }
      ],
    });
    const monthGroup = messages.reduce((acc, item) => {
      const date = new Date(item.created_at);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
      !(acc[monthYear]) ? acc[monthYear] = [] : null;
      acc[monthYear].push(item.toJSON());
      return acc;
    }, {});
    const result = Object.entries(monthGroup).map(([monthYear, messages]) => ({
      monthYear,
      messages
    }));
    return result;
  } catch (err) {
    logger.error(`Failed to get chat messages for channel ${channelId}: ${err.message}`, {
      stack: err.stack,
      channelId: channelId
    });
    return [];
  }
}

export const getChannelData = async (channelId) => {
  try {
    const channel = await Channel.findByPk(channelId, {
      include: [
        {
          model: ChannelMember,
          attributes: ['id', 'user_id', 'role', 'joined_at', 'is_active', 'is_muted', 'mute_until', 'ban_until', 'custom_data', 'invite_by', 'left_at', 'last_read_at'],
          include: [
            {
              model: User,
              attributes: ['id', 'first_name', 'last_name', 'full_name', 'username', 'email', 'avatar_url', 'created_at']
            }
          ]
        }
      ]
    });
    const plainChannel = channel.toJSON();
    delete plainChannel.version;
    delete plainChannel.updatedAt;
    delete plainChannel.deletedAt;
    return plainChannel;
  } catch (err) {
    logger.error(`Failed to get channel data for user ${channelId}: ${err.message}`, {
      stack: err.stack,
      channelId: channelId
    });
    return null;
  }
}

export const sendChannelChatMessage = async (id, channelId, message, messageType = null, attachments = null) => {
  try {
    const messageData = await Message.create({
      sender_id: id,
      channel_id: channelId,
      content: message || '',
      status: 'sent',
      message_type: messageType,
    });

    let attachmentsData = null;
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentRows = attachments.map(att => ({
        id: uuidv4(),
        message_id: messageData.id,
        sender_id: id,
        channel_id: channelId,
        mime_type: att.mime_type,
        file_type: att.file_type || (messageType !== 'mixed' ? messageType : null),
        file_url: att.file_url,
        file_name: att.file_name,
        file_size: att.file_size,
        metadata: att.metadata || {}
      }));
      await Attachment.bulkCreate(attachmentRows);
      attachmentsData = attachmentRows;
    }

    if (attachmentsData && attachmentsData.length > 0) {
      messageData.setDataValue('attachments', attachmentsData);
    }
    const date = new Date(messageData.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
    const result = {
      monthYear,
      messages: [messageData.toJSON()]
    }
    return result;
  } catch (err) {
    logger.error(`Failed to send message in channel ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    throw err;
  }
}

export const updateMemberReadAt = async (userId, channelId) => {
  try {
    await ChannelMember.update(
      { last_read_at: new Date() },
      { where: { user_id: userId, channel_id: channelId } }
    );
    return true;
  } catch (err) {
    logger.error(`Failed to update last_read_at for user ${userId} in channel ${channelId}: ${err.message}`, {
      stack: err.stack
    });
    return false;
  }
}