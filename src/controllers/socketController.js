import * as SocketService from '../services/socketService.js';

export const setupSocketHandlers = (socketIO) => {
  socketIO.on('connection', async (socket) => {
    // Set user as active on connect
    if (socket.user && socket.user.id) {
      await SocketService.updateUserActiveStatus(socket.user.id, true);
    }
    // Emit a welcome event
    socket.emit("channels", { channels: await SocketService.userChannels(socket.user.id) });

    socket.emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(socket.user.id) });

    socket.emit("personalChat", { chat: await SocketService.personalChats(socket.user.id) });

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
      socketIO.emit('new-room', { channel });
    });

    // Delete a room (channel)
    socket.on('delete-room', async ({ channelId, userId }) => {
      await SocketService.deleteChannel(socket, channelId, userId);
      socketIO.emit('room-deleted', { channelId });
    });

    // Handle incoming messages (broadcast to room)
    socket.on('message', ({ channelId, userId, message }) => {
      if (!channelId || !userId || !message) return;
      socketIO.to(channelId).emit('message', { userId, message });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      if (socket.user && socket.user.id) {
        await SocketService.updateUserActiveStatus(socket.user.id, false);
      }
    });
  });
};
