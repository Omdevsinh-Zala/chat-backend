import { config } from "../config/app.js";
import { Message } from "../models/Messages.js";
import { Attachment } from "../models/Attachments.js";
import logger from "../config/logger.js";
import { Op } from "sequelize";

export const getChannelChatMessages = async (channelId, offsets) => {
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

export const getChannelData = async (channelId) => {
    try {
        const channel = await Channel.findByPk(channelId);
        return channel.toJSON();
    } catch (err) {
        logger.error(`Failed to get channel data for user ${channelId}: ${err.message}`, {
            stack: err.stack,
            channelId: channelId
        });
        return null;
    }
}