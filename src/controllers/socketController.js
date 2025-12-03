import logger from '../config/logger.js';
import * as SocketService from '../services/socketService.js';

export function registerSocketHandlers(io, socket) {
  // Emit a welcome event
  socket.emit("welcome", { message: "Connected to socket server" });

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
    logger.info(`User disconnected: ${socket.id}`);
  });
}
