import { v4 as uuidv4 } from 'uuid';
import { ChannelMember, Channel, User, Message } from "../models/initModels.js";
import logger from '../config/logger.js';
import { Op } from 'sequelize';

export const joinChannel = async (socket, channelId, userId) => {
  if (!channelId || !userId) return socket.emit('error', { message: 'Missing channelId or userId' });
  socket.join(channelId);
  // Add user as member if not already
  let member = await ChannelMember.findOne({ where: { channel_id: channelId, user_id: userId } });
  if (!member) {
    member = await ChannelMember.create({
      id: uuidv4(),
      channel_id: channelId,
      user_id: userId,
      role: 'member',
      joined_at: new Date()
    });
  }
  socket.to(channelId).emit('user-joined', { userId });
  socket.emit('joined-room', { channelId });
}

export const leaveChannel = async (socket, channelId, userId) => {
  if (!channelId || !userId) return socket.emit('error', { message: 'Missing channelId or userId' });
  socket.leave(channelId);
  await ChannelMember.destroy({ where: { channel_id: channelId, user_id: userId } });
  socket.to(channelId).emit('user-left', { userId });
  socket.emit('left-room', { channelId });
}

export const createChannel = async (socket, { title, description, ownerId, type }) => {
  if (!title || !ownerId) return socket.emit('error', { message: 'Missing title or ownerId' });
  const channel = await Channel.create({
    id: uuidv4(),
    title,
    description: description || '',
    owner_id: ownerId,
    type: type || 'public',
    admin_ids: [ownerId],
    status: 'active'
  });
  await ChannelMember.create({
    id: uuidv4(),
    channel_id: channel.id,
    user_id: ownerId,
    role: 'owner',
    joined_at: new Date()
  });
  socket.join(channel.id);
  socket.emit('room-created', { channel });
  return channel;
}

export const deleteChannel = async (socket, channelId, userId) => {
  if (!channelId || !userId) return socket.emit('error', { message: 'Missing channelId or userId' });
  const channel = await Channel.findByPk(channelId);
  if (!channel) return socket.emit('error', { message: 'Channel not found' });
  // Only owner or admin can delete
  if (channel.owner_id !== userId && !(channel.admin_ids || []).includes(userId)) {
    return socket.emit('error', { message: 'Not authorized to delete this channel' });
  }
  await ChannelMember.destroy({ where: { channel_id: channelId } });
  await Channel.destroy({ where: { id: channelId } });
}

export const updateUserActiveStatus = async (userId, isActive) => {
  try {
    await User.update(
      { is_active: isActive },
      { where: { id: userId } }
    );
  } catch (err) {
    logger.error(`Failed to update is_active for user ${userId}: ${err}`);
  }
}

export const connectedUsersData = async (id) => {
  try {
    const user = await User.findByPk(id, {
      include: [
        {
          model: Channel,
          as: 'Channels', // Use the alias defined in belongsToMany
          through: {
            attributes: ['role', 'joined_at', 'is_muted'], // Include specific ChannelMember attributes
            where: { is_active: true } // Only active memberships
          },
          include: [
            {
              model: Message,
              limit: 50, // Limit messages per channel
              order: [['created_at', 'DESC']],
              include: [
                {
                  model: User,
                  as: 'Sender', // Need to add this alias in Message model
                  attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
                }
              ]
            }
          ],
          required: false
        },
        {
          model: Message,
          as: 'SentMessages',
          limit: 100,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: Channel,
              attributes: ['id', 'title', 'type']
            }
          ],
          required: false
        }
      ]
    });
    return user.toJSON();
  } catch (err) {
    logger.error(`Failed to get user data for user ${id}: ${err}`);
    return null;
  }
}

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
  return channels.map(channel => channel.toJSON());
}

export const recentlyMessagesUsers = async (id) => {
  try {
    // Input validation
    if (!id) {
      logger.warn('recentlyMessagesUsers called with invalid id');
      return [];
    }

    // Import sequelize instance for replacements
    const { sequelize } = User;

    // Use a more efficient query with subqueries and proper SQL injection prevention
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'first_name',
        'last_name',
        'avatar_url',
        'is_active', // Include online status
        // Subquery to get unread message count
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM messages
            WHERE messages.sender_id = "User"."id"
              AND messages.receiver_id = :userId
              AND messages.status != 'read'
              AND messages.deleted_at IS NULL
          )`),
          'unreadCount'
        ],
        // Subquery to get last message timestamp
        [
          sequelize.literal(`(
            SELECT MAX(created_at)
            FROM messages
            WHERE (messages.sender_id = "User"."id" AND messages.receiver_id = :userId)
               OR (messages.sender_id = :userId AND messages.receiver_id = "User"."id")
          )`),
          'lastMessageAt'
        ],
        // Subquery to get last message content preview
        [
          sequelize.literal(`(
            SELECT content
            FROM messages
            WHERE (messages.sender_id = "User"."id" AND messages.receiver_id = :userId)
               OR (messages.sender_id = :userId AND messages.receiver_id = "User"."id")
            ORDER BY created_at DESC
            LIMIT 1
          )`),
          'lastMessagePreview'
        ]
      ],
      where: {
        id: {
          [Op.ne]: id
        },
        // Only include users who have exchanged messages with current user
        [Op.and]: [
          sequelize.literal(`EXISTS (
            SELECT 1 FROM messages 
            WHERE (messages.sender_id = "User"."id" AND messages.receiver_id = :userId)
               OR (messages.sender_id = :userId AND messages.receiver_id = "User"."id")
          )`)
        ]
      },
      replacements: { userId: id }, // Prevents SQL injection
      order: [
        [sequelize.literal('"lastMessageAt"'), 'DESC NULLS LAST']
      ],
      limit: 8,
      raw: true, // More efficient - returns plain objects
      nest: true
    });

    // Format the response
    return users.map(user => ({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      is_active: user.is_active || false,
      unreadCount: parseInt(user.unreadCount) || 0,
      lastMessageAt: user.lastMessageAt,
      lastMessagePreview: user.lastMessagePreview ?
        (user.lastMessagePreview.length > 50
          ? user.lastMessagePreview.substring(0, 50) + '...'
          : user.lastMessagePreview)
        : null
    }));
  } catch (err) {
    logger.error(`Failed to get recently messaged users for user ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    return [];
  }
}

export const personalChats = async (id) => {
  try {
    // Input validation
    if (!id) {
      logger.warn('personalChats called with invalid id');
      return null;
    }

    // Import sequelize instance for replacements
    const { sequelize } = User;

    // Fetch user's own data with self-message statistics
    const user = await User.findOne({
      attributes: [
        'id',
        'username',
        'first_name',
        'last_name',
        'avatar_url',
        'is_active',
        // Subquery to get unread self-message count
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM messages
            WHERE messages.sender_id = :userId
              AND messages.receiver_id = :userId
              AND messages.status != 'read'
              AND messages.deleted_at IS NULL
          )`),
          'unreadCount'
        ],
        // Subquery to get last self-message timestamp
        [
          sequelize.literal(`(
            SELECT MAX(created_at)
            FROM messages
            WHERE messages.sender_id = :userId
              AND messages.receiver_id = :userId
          )`),
          'lastMessageAt'
        ],
        // Subquery to get last self-message preview
        [
          sequelize.literal(`(
            SELECT content
            FROM messages
            WHERE messages.sender_id = :userId
              AND messages.receiver_id = :userId
            ORDER BY created_at DESC
            LIMIT 1
          )`),
          'lastMessagePreview'
        ],
        // Subquery to get total self-message count
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM messages
            WHERE messages.sender_id = :userId
              AND messages.receiver_id = :userId
              AND messages.deleted_at IS NULL
          )`),
          'totalMessages'
        ]
      ],
      where: {
        id: id
      },
      replacements: { userId: id },
      raw: true
    });

    if (!user) {
      logger.error(`User not found for personalChats: ${id}`);
      return null;
    }

    // Format response - always return user data even if no self-messages
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      is_active: user.is_active || false,
      isSelf: true, // Always true for personal chat
      unreadCount: parseInt(user.unreadCount) || 0,
      totalMessages: parseInt(user.totalMessages) || 0,
      lastMessageAt: user.lastMessageAt,
      lastMessagePreview: user.lastMessagePreview ?
        (user.lastMessagePreview.length > 50
          ? user.lastMessagePreview.substring(0, 50) + '...'
          : user.lastMessagePreview)
        : null
    };
  } catch (err) {
    logger.error(`Failed to get personal chat data for user ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    return null;
  }
}