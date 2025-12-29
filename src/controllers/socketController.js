import * as SocketService from '../services/socketService.js';

export const setupSocketHandlers = (socketIO) => {
  socketIO.on('connection', async (socket) => {
    // Set user as active on connect
    if (socket.user && socket.user.id) {
      await SocketService.updateUserActiveStatus(socket.user.id, true);
      socket.join(socket.user.id);
    }
    // Emit a welcome event
    socket.emit("channels", { channels: await SocketService.userChannels(socket.user.id) });

    socket.emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(socket.user.id) });

    socket.emit("personalChat", { chat: await SocketService.personalChats(socket.user.id) });

    socket.on('chatChange', async ({ receiverId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, receiverId);
      socket.emit('chatMessages', { chat: await SocketService.getChatMessages(receiverId, senderId) });
    })

    socket.on('chatMessagesSend', async ({ receiverId, message }) => {
      const senderId = socket.user.id;
      const userMessage = await SocketService.sendChatMessage(senderId, receiverId, message);
      socketIO.to(receiverId).emit('receiveChatMessage', { chat: userMessage });
      socket.emit('receiveChatMessage', { chat: userMessage });
      socket.emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(socket.user.id) });
    })

    socket.on('readMessage', async ({ messageId }) => {
      await SocketService.readMessages(messageId);
      socket.emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(socket.user.id) });
    })

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
