import { sequelize } from '../models/index.js';
import logger from '../config/logger.js';
import * as SocketService from '../services/socketService.js';

// Helper to update is_active status
  async function updateUserActiveStatus(userId, isActive) {
    try {
      await sequelize.models.User.update(
        { is_active: isActive },
        { where: { id: userId } }
      );
    } catch (err) {
      logger.error(`Failed to update is_active for user ${userId}: ${err}`);
    }
  }

export function registerSocketHandlers(io, socket) {
  // Emit a welcome event
  socket.emit("welcome", { message: "Connected to socket server" });

  // Set user as active on connect
  if (socket.user && socket.user.id) {
    updateUserActiveStatus(socket.user.id, true);
  }

  // Join a room (channel)
  socket.on('join-room', async ({ channelId, userId }) => {
    await SocketService.joinChannel(socket, channelId, userId);
  });

  // Leave a room (channel)
  socket.on('leave-room', async ({ channelId, userId }) => {
    await SocketService.leaveChannel(socket, channelId, userId);
  });

  // Create a room (channel)
  socket.on('create-room', async ({ title, description, ownerId, type }) => {
    const channel = await SocketService.createChannel(socket, { title, description, ownerId, type });
    io.emit('new-room', { channel });
  });

  // Delete a room (channel)
  socket.on('delete-room', async ({ channelId, userId }) => {
    await SocketService.deleteChannel(socket, channelId, userId);
    io.emit('room-deleted', { channelId });
  });

  // Handle incoming messages (broadcast to room)
  socket.on('message', ({ channelId, userId, message }) => {
    if (!channelId || !userId || !message) return;
    io.to(channelId).emit('message', { userId, message });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.user && socket.user.id) {
      updateUserActiveStatus(socket.user.id, false);
    }
  });
}
