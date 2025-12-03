import { v4 as uuidv4 } from 'uuid';
import { ChannelMember } from "../models/ChannelMembers.js";
import { Channel } from "../models/Channels.js";

export const joinChannel = async (socket, channelId, userId) => {
    if (!channelId || !userId) return socket.emit('error', { message: 'Missing channelId or userId' });
    socket.join(channelId);
    // Add user as member if not already
    let member = await ChannelMember.findOne({ where: { channel_id: channelId, user_id: userId } });
    if (!member) {
        member = await ChannelMember.create({
            id: uuidv4(),
            channel_id: channelId,
            user_id: userId,
            role: 'member',
            joined_at: new Date()
        });
    }
    socket.to(channelId).emit('user-joined', { userId });
    socket.emit('joined-room', { channelId });
}

export const leaveChannel = async (socket, channelId, userId) => {
    if (!channelId || !userId) return socket.emit('error', { message: 'Missing channelId or userId' });
    socket.leave(channelId);
    await ChannelMember.destroy({ where: { channel_id: channelId, user_id: userId } });
    socket.to(channelId).emit('user-left', { userId });
    socket.emit('left-room', { channelId });
}

export const createChannel = async (socket, { title, description, ownerId, type }) => {
    if (!title || !ownerId) return socket.emit('error', { message: 'Missing title or ownerId' });
    const channel = await Channel.create({
        id: uuidv4(),
        title,
        description: description || '',
        owner_id: ownerId,
        type: type || 'public',
        admin_ids: [ownerId],
        status: 'active'
    });
    await ChannelMember.create({
        id: uuidv4(),
        channel_id: channel.id,
        user_id: ownerId,
        role: 'owner',
        joined_at: new Date()
    });
    socket.join(channel.id);
    socket.emit('room-created', { channel });
    return channel;
}

export const deleteChannel = async (socket, channelId, userId) => {
    if (!channelId || !userId) return socket.emit('error', { message: 'Missing channelId or userId' });
    const channel = await Channel.findByPk(channelId);
    if (!channel) return socket.emit('error', { message: 'Channel not found' });
    // Only owner or admin can delete
    if (channel.owner_id !== userId && !(channel.admin_ids || []).includes(userId)) {
      return socket.emit('error', { message: 'Not authorized to delete this channel' });
    }
    await ChannelMember.destroy({ where: { channel_id: channelId } });
    await Channel.destroy({ where: { id: channelId } });
}