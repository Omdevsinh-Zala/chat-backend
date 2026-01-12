import { User, Channel, ChannelMember } from "../models/initModels.js"
import { Op } from "sequelize";
import AppError from "../utils/appError.js";
import { config } from "../config/app.js";
import { Attachment } from "../models/initModels.js";
import logger from "../config/logger.js";
import { randomImage } from "../utils/profileImagePicker.js";

export const getUserData = async (id) => {
  const rawData = await User.findByPk(id);
  if (!rawData) throw new AppError("User not found.", 404);
  const userData = rawData.toJSON();

  if (userData.is_blocked) {
    throw new AppError("Your account has been blocked. Please contact support.", 403);
  }

  return userData;
}

export const updateUserData = async (id, updateUserData) => {
  const updatedUserData = await User.update(updateUserData, {
    where: { id },
    returning: true,
  });
  return updatedUserData;
}

export const getUsers = async (query) => {
  try {
    const limit = query.limit || config.pagination.limit;
    const page = query.page || 1;
    const offset = (page - 1) * limit;
    let where = {};
    if (query.search) {
      where = {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${query.search}%` } },
          { last_name: { [Op.iLike]: `%${query.search}%` } },
          { username: { [Op.iLike]: `%${query.search}%` } },
        ],
      }
    }
    const { count, rows: rawData } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ['bio', 'email', 'active_chat_id', 'is_email_verified', 'version', 'last_login', 'created_at', 'deleted_at', 'updated_at']
      },
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    const result = {
      page: Number(page),
      limit: Number(limit),
      total: Number(count),
      data: rawData.map((user) => user.toJSON()),
    }
    return result;
  } catch (err) {
    throw new AppError(err.message, 500);
  }
}

export const getAllFiles = async (id, filters) => {
  try {
    const limit = Number(filters.limit) || Number(config.pagination.limit) || 20;
    const page = Number(filters.page) || 1;
    const offset = (page - 1) * limit;
    const order = filters.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortBy = filters.sortBy || 'created_at';
    const fileType = filters.fileType || null;
    const whereClause = {
      [Op.or]: [
        { sender_id: id },
        { receiver_id: id }
      ],
    }

    if (fileType) {
      whereClause.file_type = fileType;
    }

    const { count, rows: attachments } = await Attachment.findAndCountAll({
      where: whereClause,
      order: [[sortBy, order]],
      raw: true,
      limit,
      offset
    });

    const result = {
      page,
      limit,
      total: Number(count),
      data: attachments
    }
    return result;
  } catch (err) {
    logger.error(`Failed to get all files: ${err.message}`, {
      stack: err.stack,
    });
    throw new AppError(err.message, 500);
  }
}

export const createChannel = async (id, data) => {
  try {
    const channel = await Channel.create({
      title: data.title,
      slug: data.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 7),
      owner_id: id,
      avatar_url: randomImage(),
      topic: data.topic,
      is_private: data.isPrivate,
      description: data.description,
    });
    await ChannelMember.create({
      channel_id: channel.toJSON().id,
      user_id: id,
      role: 'owner',
      invite_by: null
    });
    return true;
  } catch (err) {
    logger.error(`Failed to create channel: ${err.message}`, {
      stack: err.stack,
    });
    throw new AppError(err.message, 500);
  }
}

export const getAllChannels = async (id, filters) => {
  try {
    const limit = Number(filters.limit) || Number(config.pagination.limit) || 20;
    const page = Number(filters.page) || 1;
    const offset = (page - 1) * limit;
    const order = filters.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortBy = filters.sortBy || 'created_at';
    const whereClause = {
      is_private: false,
    }

    if(filters.search){
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
      ]
    }

    const { count, rows: channels } = await Channel.findAndCountAll({
      where: whereClause,
      order: [[sortBy, order]],
      include: [
        {
          model: ChannelMember,
          where: { user_id: id },
          attributes: ['user_id'],
          required: false,
        }
      ],
      limit,
      offset
    });

    const rawChannels = channels.map((channel) => {
      const data = channel.toJSON();
      delete data.status;
      delete data.last_message_at;
      delete data.version;
      delete data.updated_at;
      delete data.deletedAt;
      delete data.admin_ids;
      data.isMember = data.ChannelMembers.length > 0;
      delete data.ChannelMembers;
      return data;
    });

    const result = {
      page,
      limit,
      total: Number(count),
      data: rawChannels
    }
    return result;
  } catch (err) {
    logger.error(`Failed to get all channels: ${err.message}`, {
      stack: err.stack,
    });
    throw new AppError(err.message, 500);
  }
}

export const getChannelData = async (id, channelId) => {
  try {
    const channelData = await Channel.findByPk(channelId, {
      include: [
        {
          model: ChannelMember,
          attributes: ['user_id', 'role'],
          required: false,
          include: [
            {
              model: User,
              attributes: ['id', 'first_name', 'last_name', 'username', 'avatar_url', 'is_active', 'full_name'],
            }
          ]
        }
      ],
    });

    if (!channelData) throw new AppError("Channel not found.", 404);

    const channel = channelData.toJSON();
    const isMember = channel.ChannelMembers.find((user) => user.user_id === id);
    if(isMember){
      channel.isMember = true;
      let members = [];
      for(let i = 0; i < 10; i++) {
        let some = channel.ChannelMembers.map(({role, User}) => ({ role, ...User }));
        members.push(...some);
      }
      channel.ChannelMembers = members;
      return channel;
    } else {
      delete channel.ChannelMembers;
      channel.isMember = false;
      return channel;
    }
  } catch(err) {
    logger.error(`Failed to get channel info: ${err.message}`, {
      stack: err.stack,
    });
    throw new AppError(err.message, 500);
  }
}

export const joinChannel = async (id, data) => {
  try {
    const channelData = await Channel.findByPk(data.channelId);
    if (!channelData) throw new AppError("Channel not found.", 404);
    await ChannelMember.create({
      channel_id: data.channelId,
      user_id: id,
      role: 'member',
      invite_by: data.inviteBy
    });
    return true;
  } catch(err) {
    logger.error(`Failed to join channel: ${err.message}`, {
      stack: err.stack,
    });
    throw new AppError(err.message, 500);
  }
}