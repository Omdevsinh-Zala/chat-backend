import { User } from "../models/initModels.js"
import { Op } from "sequelize";
import AppError from "../utils/appError.js";
import { config } from "../config/app.js";
import { Message } from "../models/initModels.js";
import logger from "../config/logger.js";

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
    const limit = filters.limit || config.pagination.limit;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;
    const order = filters.order || 'DESC';
    const sortBy = filters.sortBy || 'created_at';
    const whereClause = {
      [Op.or]: [
        { sender_id: id },
        { receiver_id: id }
      ],
      status: 'read',
      message_type: {
        [Op.or]: ["image", "video", "file", "audio", "pdf", "system", "mixed"]
      },
      attachments: {
        [Op.ne]: null
      }
    }

    const messages = await Message.findAll({
      where: whereClause,
      attributes: ['attachments'],
      order: [[sortBy, order]],
      raw: true
    });

    const allAttachments = messages.flatMap(m => m.attachments || []);
    const count = allAttachments.length;
    const attachments = allAttachments.slice(offset, offset + limit);

    const result = {
      page: Number(page),
      limit: Number(limit),
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