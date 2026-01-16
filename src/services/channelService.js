import { config } from "../config/app.js";
import { Channel, Attachment, Message, ChannelMember, User } from "../models/initModels.js";
import { Op } from "sequelize";
import logger from "../config/logger.js";
import { v4 as uuidv4 } from 'uuid';
import AppError from "../utils/appError.js";

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

  const channelsData = await Promise.all(channels.map(async (channel) => {
    const plainChannel = channel.toJSON();
    const member = plainChannel.Members[0]; // Since we filtered by user id, this is the current user's member record
    const lastReadAt = member.ChannelMember.last_read_at;

    const unreadCount = await Message.count({
      where: {
        channel_id: channel.id,
        created_at: {
          [Op.gt]: lastReadAt || new Date(0) // If never read, count all (or from beginning of time)
        },
        sender_id: {
          [Op.ne]: id // Don't count own messages
        }
      }
    });

    plainChannel.unread_count = unreadCount;

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
  }));

  return channelsData;
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
    const sender = await User.findByPk(id, {
      attributes: ['id', 'first_name', 'last_name', 'full_name', 'username', 'avatar_url']
    });

    const messageJson = messageData.toJSON();
    messageJson.Sender = sender ? sender.toJSON() : null;

    const date = new Date(messageData.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
    const result = {
      monthYear,
      messages: [messageJson]
    }

    const channelMembers = await ChannelMember.findAll({
      where: { channel_id: channelId },
      attributes: ['user_id'],
      raw: true,
    });

    return { result, userIds: channelMembers.map(member => member.user_id) };
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

export const joinChannel = async (id, data) => {
  try {
    const user = await User.findByPk(id);
    if (!user) throw new AppError("User not found.", 404);
    const channelData = await Channel.findByPk(data.channelId);
    if (!channelData) throw new AppError("Channel not found.", 404);

    // Check if citizen is already a member
    const existingMember = await ChannelMember.findOne({
      where: {
        user_id: id,
        channel_id: data.channelId
      }
    });

    if (!existingMember) {
      await ChannelMember.create({
        channel_id: data.channelId,
        user_id: id,
        role: 'member',
        invite_by: data.inviteBy
      });
    }

    const messageData = await Message.create({
      sender_id: id,
      channel_id: data.channelId,
      content: `${user.full_name} joined the channel.`,
      message_type: 'system',
    });

    const date = new Date(messageData.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
    const result = {
      monthYear,
      messages: [messageData.toJSON()]
    };

    const channelMembers = await ChannelMember.findAll({
      where: { channel_id: data.channelId },
      attributes: ['user_id'],
      raw: true,
    });

    return { result, userIds: channelMembers.map(member => member.user_id), error: null };
  } catch (err) {
    logger.error(`Failed to join channel: ${err.message}`, {
      stack: err.stack,
    });
    return { result: null, userIds: null, error: err.message };
  }
}

export const leaveChannel = async (id, channelId) => {
  try {
    const user = await User.findByPk(id);
    if (!user) throw new AppError('User not found.', 404);
    const channelData = await Channel.findByPk(channelId);
    if (!channelData) throw new AppError('Channel not found.', 404);
    if (channelData.toJSON().owner_id === id) throw new AppError('Can not leave channel as owner!', 400);

    // Actually delete the member
    await ChannelMember.destroy({
      where: {
        user_id: id,
        channel_id: channelId,
      },
      force: true
    });

    const messageData = await Message.create({
      sender_id: id,
      channel_id: channelId,
      content: `${user.full_name} left the channel.`,
      message_type: 'system',
    });
    const date = new Date(messageData.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
    const result = {
      monthYear,
      messages: [messageData.toJSON()]
    }

    // Get remaining members to notify
    const channelMembers = await ChannelMember.findAll({
      where: { channel_id: channelId },
      attributes: ['user_id'],
      raw: true,
    });

    await user.update({
      active_chat_id: null,
      is_last_active_chat_channel: false,
    });

    // Notify remaining members
    return { result, userIds: channelMembers.map(member => member.user_id), error: null };

  } catch (err) {
    logger.error(`Failed to leave channel: ${err.message}`, {
      stack: err.stack,
    });
    return { result: null, userIds: null, error: err.message };
  }
}

export const removeUser = async (requesterId, targetUserId, channelId) => {
  try {
    const requester = await User.findByPk(requesterId);
    const targetUser = await User.findByPk(targetUserId);

    if (!requester || !targetUser) throw new AppError('User not found.', 404);
    if (requesterId === targetUserId) throw new AppError('You cannot remove yourself.', 400);

    const channelData = await Channel.findByPk(channelId);
    if (!channelData) throw new AppError('Channel not found.', 404);

    const requesterMember = await ChannelMember.findOne({ where: { user_id: requesterId, channel_id: channelId } });
    const targetMember = await ChannelMember.findOne({ where: { user_id: targetUserId, channel_id: channelId } });

    if (!requesterMember || !targetMember) throw new AppError('One or both users are not members of this channel.', 400);

    const requesterRole = requesterMember.role;
    const targetRole = targetMember.role;

    // Role Verification Logic
    if (requesterRole === 'owner') {
      // Owner can remove anyone (except self, handled above)
    } else if (requesterRole === 'admin') {
      if (targetRole === 'admin' || targetRole === 'owner') {
        throw new AppError('Admins cannot remove other Admins or the Owner.', 403);
      }
    } else {
      throw new AppError('You do not have permission to remove users.', 403);
    }

    // Actually delete the member
    await ChannelMember.destroy({
      where: {
        user_id: targetUserId,
        channel_id: channelId,
      },
      force: true
    });

    const messageData = await Message.create({
      sender_id: requesterId,
      channel_id: channelId,
      content: `${targetUser.full_name} was removed from the channel by ${requester.full_name}.`,
      message_type: 'system',
    });
    const date = new Date(messageData.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
    const result = {
      monthYear,
      messages: [messageData.toJSON()]
    }

    // Get remaining members to notify
    const channelMembers = await ChannelMember.findAll({
      where: { channel_id: channelId },
      attributes: ['user_id'],
      raw: true,
    });

    await targetUser.update({
      active_chat_id: null,
      is_last_active_chat_channel: false,
    });

    // Notify remaining members
    return { result, userIds: channelMembers.map(member => member.user_id), removedUserId: targetUserId, error: null };

  } catch (err) {
    logger.error(`Failed to remove user from channel: ${err.message}`, {
      stack: err.stack,
    });
    return { result: null, userIds: null, error: err.message };
  }
}