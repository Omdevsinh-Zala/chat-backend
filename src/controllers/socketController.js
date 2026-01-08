import * as SocketService from '../services/socketService.js';
import * as ChannelSocketService from '../services/channelService.js';

export const setupSocketHandlers = (socketIO) => {
  socketIO.on('connection', async (socket) => {
    // Set user as active on connect
    if (socket.user && socket.user.id) {
      await SocketService.updateUserActiveStatus(socket.user.id, true);
      socket.join(socket.user.id);
    }
    // Emit a welcome event
    socketIO.to(socket.user.id).emit("channels", { channels: await SocketService.userChannels(socket.user.id) });

    socketIO.to(socket.user.id).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(socket.user.id) });

    socketIO.to(socket.user.id).emit("personalChat", { chat: await SocketService.personalChats(socket.user.id) });

    socket.on('channelCreated', async () => {
      socketIO.to(socket.user.id).emit("channels", { channels: await SocketService.userChannels(socket.user.id) });
    })

    socket.on('channelChatChange', async ({ channelId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, channelId);
      socketIO.to(socket.user.id).emit('channelChatMessages', { chat: await ChannelSocketService.getChannelChatMessages(channelId, null), channelData: await ChannelSocketService.getChannelData(channelId) });
    })

    socket.on('chatChange', async ({ receiverId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, receiverId);
      socketIO.to(socket.user.id).emit('chatMessages', { chat: await SocketService.getChatMessages(receiverId, senderId, null), receiverData: await SocketService.getReceiverData(receiverId) });
    })

    socket.on('chatMessagesSend', async ({ receiverId, message, messageType, attachments }) => {
      const senderId = socket.user.id;
      const userMessage = await SocketService.sendChatMessage(senderId, receiverId, message, messageType, attachments);
      socketIO.to(receiverId).emit('receiveChatMessage', { chat: userMessage });
      socketIO.to(socket.user.id).emit('receiveChatMessage', { chat: userMessage });
      socketIO.to(receiverId).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(receiverId) });
      socketIO.to(senderId).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(senderId) });
    })

    socket.on('typing', async ({ receiverId, isTyping }) => {
      const senderId = socket.user.id;
      socketIO.to(receiverId).emit('typing', { senderId, isTyping });
      socketIO.to(receiverId).emit('userTyping', { isTyping });
    })

    socket.on('appendMessages', async ({ receiverId, offset }) => {
      const senderId = socket.user.id;
      const messages = await SocketService.getChatMessages(receiverId, senderId, offset);
      socketIO.to(socket.user.id).emit('appendedMessages', { chat: messages });
    })

    socket.on('readMessage', async ({ receiverId, messageId }) => {
      const currentUserId = socket.user.id;
      const userMessage = await SocketService.readMessages(receiverId, messageId);

      if (userMessage) {
        // Emit to the receiver (current user who marked it as read)
        socketIO.to(receiverId).emit('receiveChatMessage', { chat: userMessage });

        // Emit to the sender so they see the status update
        socketIO.to(userMessage.messages[0].sender_id).emit('receiveChatMessage', { chat: userMessage });

        // Update recently messaged users for the current user
        socketIO.to(socket.user.id).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(currentUserId) });
      }
    });

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
