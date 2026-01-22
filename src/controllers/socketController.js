import * as SocketService from '../services/socketService.js';
import * as ChannelSocketService from '../services/channelService.js';
import * as NotificationService from '../services/notificationService.js';
import * as UserService from '../services/userService.js';

export const setupSocketHandlers = (socketIO) => {
  socketIO.on('connection', async (socket) => {
    // Set user as active on connect
    if (socket.user && socket.user.id) {
      await SocketService.updateUserActiveStatus(socket.user.id, true);
      socket.broadcast.emit('userStatusChanged', { userId: socket.user.id, isOnline: true });
      socket.join(socket.user.id);

      // Re-join all channel rooms the user is a member of
      const userChannels = await ChannelSocketService.userChannels(socket.user.id);
      userChannels.forEach(channel => {
        socket.join(channel.id);
      });
    }

    // Emit initial data
    socketIO.to(socket.user.id).emit("channels", {
      channels: await ChannelSocketService.userChannels(socket.user.id)
    });
    socketIO.to(socket.user.id).emit("recentlyMessagesUsers", {
      users: await SocketService.recentlyMessagesUsers(socket.user.id)
    });
    socketIO.to(socket.user.id).emit("personalChat", {
      chat: await SocketService.personalChats(socket.user.id)
    });

    // --- Channel Handlers ---
    socket.on('joinChannel', async (data) => {
      const senderId = socket.user.id;
      const { result, error } = await ChannelSocketService.joinChannel(senderId, data);
      if (error) {
        socketIO.to(senderId).emit('joinChannelErrorMessage', { error });
        return;
      }
      socket.join(data.channelId);
      socketIO.to(senderId).emit("channels", { channels: await ChannelSocketService.userChannels(senderId) });
      socketIO.to(data.channelId).emit('receiveChannelChatMessage', { chat: result });
      socketIO.to(socket.user.id).emit('redirectToChannel', { redirectId: data.channelId });
    });

    socket.on('leaveChannel', async ({ channelId }) => {
      const senderId = socket.user.id;
      const { result, error } = await ChannelSocketService.leaveChannel(senderId, channelId);
      if (error) {
        socketIO.to(senderId).emit('leaveChannelErrorMessage', { error });
        return;
      }
      socket.leave(channelId);
      socketIO.to(socket.user.id).emit("channels", { channels: await ChannelSocketService.userChannels(socket.user.id) });
      socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: result });
      socketIO.to(socket.user.id).emit('redirectToChannel', { redirectId: null });
    });

    socket.on('removeUser', async ({ channelId, userId }) => {
      const senderId = socket.user.id;
      const { result, removedUserId, error } = await ChannelSocketService.removeUser(senderId, userId, channelId);
      if (error) {
        socketIO.to(senderId).emit('removeUserErrorMessage', { error });
        return;
      }
      const allSockets = await socketIO.fetchSockets();
      const targetSocket = allSockets.find(s => s.user && s.user.id === removedUserId);
      if (targetSocket) {
        targetSocket.leave(channelId);
        targetSocket.emit("channels", { channels: await ChannelSocketService.userChannels(removedUserId) });
        targetSocket.emit('redirectToChannel', { redirectId: null });
      }
      socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: result });
      socketIO.to(channelId).emit('userRemoved', { channelId, removedUserId });
    });

    socket.on('deleteChannel', async ({ channelId }) => {
      const senderId = socket.user.id;
      const channelData = await ChannelSocketService.getChannelData(channelId);

      // Only owner can delete
      if (channelData.owner_id !== senderId) {
        socketIO.to(senderId).emit('deleteChannelError', { error: 'Only channel owner can delete the channel' });
        return;
      }

      // Soft delete the channel
      await ChannelSocketService.deleteChannel(channelId);

      // Notify all members and remove them from channel room
      socketIO.to(channelId).emit('channelDeleted', { channelId });

      const allSockets = await socketIO.fetchSockets();
      for (const s of allSockets) {
        if (s.rooms.has(channelId)) {
          s.leave(channelId);
          if (s.user && s.user.id) {
            socketIO.to(s.user.id).emit('channels', { channels: await ChannelSocketService.userChannels(s.user.id) });
          }
        }
      }
    });

    socket.on('updateMemberRole', async ({ channelId, userId, role }) => {
      const requesterId = socket.user.id;
      const { error, previousOwnerId, message } = await ChannelSocketService.updateMemberRole(requesterId, channelId, userId, role);

      if (error) {
        socketIO.to(requesterId).emit('updateRoleError', { error });
        return;
      }

      // Notify all channel members about the role change
      socketIO.to(channelId).emit('memberRoleUpdated', {
        channelId,
        userId,
        newRole: role,
        previousOwnerId
      });

      if (message) {
        socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: message });
      }

      // Refresh channel data for all members
      const allSockets = await socketIO.fetchSockets();
      for (const s of allSockets) {
        if (s.rooms.has(channelId) && s.user && s.user.id) {
          socketIO.to(s.user.id).emit('channels', { channels: await ChannelSocketService.userChannels(s.user.id) });
        }
      }
    });

    socket.on('channelCreated', async () => {
      socketIO.to(socket.user.id).emit("channels", { channels: await ChannelSocketService.userChannels(socket.user.id) });
    });

    socket.on('channelChatChange', async ({ channelId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, channelId, true);
      socketIO.to(socket.user.id).emit('channelChatMessages', {
        chat: await ChannelSocketService.getChannelChatMessages(senderId, channelId, null),
        channelData: await ChannelSocketService.getChannelData(channelId)
      });
    });

    socket.on('channelMemberTyping', async ({ channelId, isTyping }) => {
      const senderId = socket.user.id;
      socketIO.to(channelId).emit('channelMemberTyping', { senderId, isTyping });
    });

    socket.on('channelChatMessagesSend', async ({ channelId, message, messageType, attachments }) => {
      const senderId = socket.user.id;
      const { result } = await ChannelSocketService.sendChannelChatMessage(senderId, channelId, message, messageType, attachments);
      socketIO.to(channelId).emit('receiveChannelChatMessage', { chat: result });

      // Unified Notification
      const channelData = await ChannelSocketService.getChannelData(channelId);
      const members = channelData.ChannelMembers || [];
      const sender = await SocketService.getReceiverData(senderId);

      members.forEach(member => {
        if (member.user_id !== senderId) {
          NotificationService.createAndSendNotification({
            userId: member.user_id,
            senderId: senderId,
            title: channelData.title,
            body: `${sender.first_name}: ` + (attachments ? 'Sent a file' : message),
            type: 'message',
            channelId: channelId,
            messageId: result.messages[0].id,
          });
        }
      });
    });

    socket.on('appendChannelMessages', async ({ channelId, offset }) => {
      const senderId = socket.user.id;
      const messages = await ChannelSocketService.getChannelChatMessages(senderId, channelId, offset);
      socketIO.to(socket.user.id).emit('appendedChannelMessages', { chat: messages });
    });

    socket.on('markChannelRead', async ({ channelId }) => {
      const userId = socket.user.id;
      await ChannelSocketService.updateMemberReadAt(userId, channelId);
      socket.to(channelId).emit('channelReadUpdated', { channelId, userId, lastReadAt: new Date() });
    });

    // --- User Chat Handlers ---
    socket.on('chatChange', async ({ receiverId }) => {
      const senderId = socket.user.id;
      await SocketService.UpdateUserActiveChatId(senderId, receiverId, false);
      socketIO.to(socket.user.id).emit('chatMessages', {
        chat: await SocketService.getChatMessages(receiverId, senderId, null),
        receiverData: await SocketService.getReceiverData(receiverId)
      });
    });

    socket.on('chatMessagesSend', async ({ receiverId, message, messageType, attachments }) => {
      const senderId = socket.user.id;
      const userMessage = await SocketService.sendChatMessage(senderId, receiverId, message, messageType, attachments);
      socketIO.to(receiverId).emit('receiveChatMessage', { chat: userMessage });
      socketIO.to(socket.user.id).emit('receiveChatMessage', { chat: userMessage });
      socketIO.to(receiverId).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(receiverId) });
      socketIO.to(senderId).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(senderId) });

      // Unified Notification
      const sender = await SocketService.getReceiverData(senderId);
      NotificationService.createAndSendNotification({
        userId: receiverId,
        senderId: senderId,
        title: sender.first_name,
        body: `${sender.first_name}: ` + (attachments ? 'Sent a file' : message),
        type: 'message',
        messageId: userMessage.messages[0].id,
      });
    });

    socket.on('typing', async ({ receiverId, isTyping }) => {
      const senderId = socket.user.id;
      socketIO.to(receiverId).emit('typing', { senderId, isTyping });
      socketIO.to(receiverId).emit('userTyping', { isTyping });
    });

    socket.on('appendMessages', async ({ receiverId, offset }) => {
      const senderId = socket.user.id;
      const messages = await SocketService.getChatMessages(receiverId, senderId, offset);
      socketIO.to(socket.user.id).emit('appendedMessages', { chat: messages });
    });

    socket.on('readMessage', async ({ receiverId, messageId }) => {
      const currentUserId = socket.user.id;
      const userMessage = await SocketService.readMessages(receiverId, messageId);
      if (userMessage) {
        socketIO.to(receiverId).emit('receiveChatMessage', { chat: userMessage });
        socketIO.to(userMessage.messages[0].sender_id).emit('receiveChatMessage', { chat: userMessage });
        socketIO.to(socket.user.id).emit("recentlyMessagesUsers", { users: await SocketService.recentlyMessagesUsers(currentUserId) });
      }
    });

    // User profile changes
    socket.on('profileImageChange', async ({ image }) => {
      const userId = socket.user.id;
      socket.broadcast.emit("userImageChanged", { userId, avatar_url: image });
    });

    socket.on('profileInfoChange', async (data) => {
      const userId = socket.user.id;
      socket.broadcast.emit("userProfileInfoChanged", { userId, data });
    })

    socket.on('disconnect', async () => {
      if (socket.user && socket.user.id) {
        await SocketService.updateUserActiveStatus(socket.user.id, false);
        socket.broadcast.emit('userStatusChanged', { userId: socket.user.id, isOnline: false });
      }
    });
  });
};
