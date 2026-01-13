import { v4 as uuidv4 } from 'uuid';
import { ChannelMember, Channel, User, Message, Attachment } from "../models/initModels.js";
import logger from '../config/logger.js';
import { Op } from 'sequelize';
import { config } from '../config/app.js';

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
                  as: 'Sender',
                  attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url']
                },
                {
                  model: Attachment,
                  as: 'attachments',
                  attributes: ['id', 'file_type', 'file_name', 'file_size', 'file_url', 'mime_type', 'created_at']
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
            },
            {
              model: Attachment,
              as: 'attachments',
              attributes: ['id', 'file_type', 'file_name', 'file_size', 'file_url', 'mime_type', 'created_at']
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

export const recentlyMessagesUsers = async (id) => {
  try {
    // Input validation
    if (!id) {
      logger.warn('recentlyMessagesUsers called with invalid id');
      return [];
    }

    // 1. Fetch recent messages to identify recent contacts
    const distinctUsers = new Map();
    const recentMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: id },
          { receiver_id: id }
        ],
        deleted_at: null
      },
      order: [['created_at', 'DESC']],
      limit: 100 // Look at last 100 messages to find active chats
    });

    // 2. Extract unique users (excluding self)
    for (const msg of recentMessages) {
      if (distinctUsers.size >= 8) break;

      const otherId = msg.sender_id === id ? msg.receiver_id : msg.sender_id;
      if (otherId === id) continue; // Exclude self (handled by personalChats)

      if (!distinctUsers.has(otherId)) {
        distinctUsers.set(otherId, {
          lastMessage: msg
        });
      }
    }

    if (distinctUsers.size === 0) return [];

    const userIds = Array.from(distinctUsers.keys());

    // 3. Fetch User Details
    const users = await User.findAll({
      where: {
        id: { [Op.in]: userIds }
      },
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url', 'is_active'],
      raw: true
    });

    // 4. Fetch Unread Counts
    const unreadCounts = await Message.count({
      where: {
        sender_id: { [Op.in]: userIds },
        receiver_id: id,
        status: { [Op.ne]: 'read' },
        deleted_at: null
      },
      group: ['sender_id']
    });

    // Convert count array to map for easy lookup
    // Sequelize group count returns array of { sender_id, count } or objects depending on version, usually safe to handle array
    const unreadMap = {};
    if (Array.isArray(unreadCounts)) {
      unreadCounts.forEach(entry => {
        // Entry might be { sender_id: '...', count: N } or { [group_key]: '...', count: N }
        unreadMap[entry.sender_id] = entry.count;
      });
    }

    // 5. Assemble Response (maintaining recent order)
    return userIds.map(userId => {
      const user = users.find(u => u.id === userId);
      if (!user) return null;

      const stats = distinctUsers.get(userId);
      const lastMsg = stats.lastMessage;

      return {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        is_active: user.is_active || false,
        unreadCount: parseInt(unreadMap[userId] || 0),
        is_typing: false,
        lastMessageAt: lastMsg.created_at,
        lastMessagePreview: lastMsg.content ?
          (lastMsg.content.length > 50 ? lastMsg.content.substring(0, 50) + '...' : lastMsg.content)
          : null
      };
    }).filter(Boolean);
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

    // Fetch user details
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url', 'is_active'],
      raw: true
    });

    if (!user) {
      logger.error(`User not found for personalChats: ${id}`);
      return null;
    }

    // Fetch stats in parallel
    const [unreadCount, totalMessages, lastMessage] = await Promise.all([
      Message.count({
        where: {
          sender_id: id,
          receiver_id: id,
          status: { [Op.ne]: 'read' },
          deleted_at: null
        }
      }),
      Message.count({
        where: {
          sender_id: id,
          receiver_id: id,
          deleted_at: null
        }
      }),
      Message.findOne({
        where: {
          sender_id: id,
          receiver_id: id
        },
        order: [['created_at', 'DESC']],
        attributes: ['created_at', 'content'],
        raw: true
      })
    ]);

    // Add properties to user object to match previous structure
    user.unreadCount = unreadCount;
    user.totalMessages = totalMessages;
    user.lastMessageAt = lastMessage ? lastMessage.created_at : null;
    user.lastMessagePreview = lastMessage ? lastMessage.content : null;

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

export const UpdateUserActiveChatId = async (id, chatId, isChannel) => {
  try {
    await User.update({ active_chat_id: chatId, is_last_active_chat_channel: isChannel }, { where: { id } });
    logger.info(`User active id changed to ${chatId} for user ${id}`);
  } catch (err) {
    logger.error(`Failed to update active chat ID for user ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    throw err;
  }
}

export const getChatMessages = async (receiverId, senderId, offsets) => {
  try {
    const limit = config.pagination.limit || 20;
    const offset = offsets !== null ? offsets : 0;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId }
        ]
      },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'file_type', 'file_name', 'file_size', 'file_url', 'mime_type', 'created_at']
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
    logger.error(`Failed to get chat messages for user ${senderId}: ${err.message}`, {
      stack: err.stack,
      userId: senderId
    });
    return [];
  }
}

export const sendChatMessage = async (id, chatId, message, messageType = null, attachments = null) => {
  try {
    const messageData = await Message.create({
      sender_id: id,
      receiver_id: chatId,
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
        receiver_id: chatId,
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
    logger.error(`Failed to send message to user ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    throw err;
  }
}

export const readMessages = async (id, messageId) => {
  try {
    // Only mark as read if the current user is the receiver of the message
    await Message.update(
      { status: 'read' },
      {
        where: {
          id: messageId,
          receiver_id: id  // Ensure only the receiver can mark as read
        },
      }
    );
    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'file_type', 'file_name', 'file_size', 'file_url', 'mime_type', 'created_at']
        }
      ]
    });

    if (!message) return false;

    const date = new Date(message.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric' });
    const result = {
      monthYear,
      messages: [message.toJSON()]
    }
    return result;
  } catch (err) {
    logger.error(`Failed to read messages for user ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    return false;
  }
}

export const getReceiverData = async (id) => {
  try {
    const receiverData = await User.findByPk(id, {
      attributes: ['id', 'username', 'first_name', 'last_name', 'avatar_url', 'full_name'],
    });
    return receiverData.toJSON();
  } catch (err) {
    logger.error(`Failed to get receiver data for user ${id}: ${err.message}`, {
      stack: err.stack,
      userId: id
    });
    return null;
  }
}