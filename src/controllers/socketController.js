import * as SocketService from '../services/socketService.js';
import * as ChannelSocketService from '../services/channelService.js';

export const setupSocketHandlers = (socketIO) => {
  socketIO.on('connection', async (socket) => {
    // Set user as active on connect
    if (socket.user && socket.user.id) {
      await SocketService.updateUserActiveStatus(socket.user.id, true);
      socket.broadcast.emit('userStatusChanged', { userId: socket.user.id, isOnline: true });
      socket.join(socket.user.id);
    }
    // Emit a welcome event
    socketIO.to(socket.user.id).emit("channels", { channels: await ChannelSocketService.userChannels(socket.user.id) });

    socketIO.to(socket.user.id).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(socket.user.id) });

    socketIO.to(socket.user.id).emit("personalChat", { chat: await SocketService.personalChats(socket.user.id) });

    // For Channels communication with socket
    socket.on('joinChannel', async (data) => {
      const senderId = socket.user.id;
      const { result, userIds, error } = await ChannelSocketService.joinChannel(senderId, data);
      if (error) {
        socketIO.to(senderId).emit('joinChannelErrorMessage', { error });
        return;
      }
      socketIO.to(senderId).emit("channels", { channels: await ChannelSocketService.userChannels(senderId) });
      socketIO.to(data.channelId).emit('receiveChannelChatMessage', { chat: result });
      socketIO.to(socket.user.id).emit('receiveChannelChatMessage', { chat: result });
      userIds.forEach(userId => {
        if (userId !== senderId) {
          socketIO.to(userId).emit('receiveChannelChatMessage', { chat: result });
        }
      });
      socketIO.to(socket.user.id).emit('redirectToChannel', { redirectId: data.channelId });
    });

    socket.on('leaveChannel', async ({ channelId }) => {
      const senderId = socket.user.id;
      const { result, userIds, error } = await ChannelSocketService.leaveChannel(senderId, channelId);
      if (error) {
        socketIO.to(senderId).emit('leaveChannelErrorMessage', { error });
        return;
      }
      socketIO.to(socket.user.id).emit("channels", { channels: await ChannelSocketService.userChannels(socket.user.id) });
      socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: result });
      userIds.forEach(userId => {
        if (userId !== senderId) {
          socketIO.to(userId).emit('receiveChannelChatMessage', { chat: result });
        }
      });
      socketIO.to(socket.user.id).emit('redirectToChannel', { redirectId: null });
    })

    socket.on('removeUser', async ({ channelId, userId }) => {
      const senderId = socket.user.id;
      const { result, userIds, removedUserId, error } = await ChannelSocketService.removeUser(senderId, userId, channelId);
      if (error) {
        socketIO.to(senderId).emit('removeUserErrorMessage', { error });
        return;
      }

      // Update channels list for the removed user
      socketIO.to(removedUserId).emit("channels", { channels: await ChannelSocketService.userChannels(removedUserId) });
      // Redirect removed user if they are currently viewing the channel
      socketIO.to(removedUserId).emit('redirectToChannel', { redirectId: null });

      // Notify channel
      socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: result });
      userIds.forEach(uid => {
        socketIO.to(uid).emit('receiveChannelChatMessage', { chat: result });
      });

      // Update member list in channel info for everyone currently viewing it
      // (This might require a standardized event, but for now we rely on the chat message to implicitly signal update or the user re-fetching)
      // Ideally we broadcast 'channelMembersUpdated' or similar. 
      // Given the current architecture, I'll stick to chat message + maybe reloading channel data if needed.
    })

    socket.on('channelCreated', async () => {
      socketIO.to(socket.user.id).emit("channels", { channels: await ChannelSocketService.userChannels(socket.user.id) });
    })

    socket.on('channelChatChange', async ({ channelId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, channelId, true);
      socketIO.to(socket.user.id).emit('channelChatMessages', { chat: await ChannelSocketService.getChannelChatMessages(senderId, channelId, null), channelData: await ChannelSocketService.getChannelData(channelId) });
    })

    socket.on('channelMemberTyping', async ({ channelId, isTyping }) => {
      const senderId = socket.user.id;
      socketIO.to(channelId).emit('channelMemberTyping', { senderId, isTyping });
    })

    socket.on('channelChatMessagesSend', async ({ channelId, message, messageType, attachments }) => {
      const senderId = socket.user.id;
      const { result, userIds } = await ChannelSocketService.sendChannelChatMessage(senderId, channelId, message, messageType, attachments);
      socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: result });
      socketIO.to(socket.user.id).emit('receiveChannelChatMessage', { chat: result });
      userIds.forEach(userId => {
        if (userId !== senderId) {
          socketIO.to(userId).emit('receiveChannelChatMessage', { chat: result });
        }
      });
    })

    socket.on('appendChannelMessages', async ({ channelId, offset }) => {
      const senderId = socket.user.id;
      const messages = await ChannelSocketService.getChannelChatMessages(senderId, channelId, offset);
      socketIO.to(socket.user.id).emit('appendedChannelMessages', { chat: messages });
    })

    socket.on('markChannelRead', async ({ channelId }) => {
      const userId = socket.user.id;
      await ChannelSocketService.updateMemberReadAt(userId, channelId);
      // Notify other members that this user has read the messages
      socket.to(channelId).emit('channelReadUpdated', { channelId, userId, lastReadAt: new Date() });
    })

    // For User communication with socket
    socket.on('chatChange', async ({ receiverId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, receiverId, false);
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

    // Handle disconnect
    socket.on('disconnect', async () => {
      if (socket.user && socket.user.id) {
        await SocketService.updateUserActiveStatus(socket.user.id, false);
        socket.broadcast.emit('userStatusChanged', { userId: socket.user.id, isOnline: false });
      }
    });
  });
};
