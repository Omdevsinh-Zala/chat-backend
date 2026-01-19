import { Channel, ChannelMember } from '../models/initModels.js';
import logger from '../config/logger.js';
import { sequelize } from '../models/index.js';

export const deleteChannel = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user.id;
        const channelId = req.params.id;

        const channel = await Channel.findByPk(channelId);

        if (!channel) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Channel not found' });
        }

        // Only owner can delete channel
        if (channel.owner_id !== userId) {
            await transaction.rollback();
            return res.status(403).json({ status: 'error', message: 'Only channel owner can delete the channel' });
        }

        // Soft delete channel
        await channel.update({ status: 'deleted' }, { transaction });

        await transaction.commit();

        res.status(200).json({
            status: 'success',
            message: 'Channel deleted successfully'
        });
    } catch (err) {
        await transaction.rollback();
        logger.error(`Failed to delete channel: ${err.message}`);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const updateMemberRole = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const requesterId = req.user.id;
        const { channelId, userId } = req.params;
        const { role } = req.body;

        const channel = await Channel.findByPk(channelId);

        if (!channel) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Channel not found' });
        }

        // Only owner can change roles
        if (channel.owner_id !== requesterId) {
            await transaction.rollback();
            return res.status(403).json({ status: 'error', message: 'Only channel owner can change member roles' });
        }

        const member = await ChannelMember.findOne({
            where: { channel_id: channelId, user_id: userId }
        });

        if (!member) {
            await transaction.rollback();
            return res.status(404).json({ status: 'error', message: 'Member not found in channel' });
        }

        // Cannot change own role
        if (userId === requesterId) {
            await transaction.rollback();
            return res.status(400).json({ status: 'error', message: 'Cannot change your own role' });
        }

        // If promoting to owner, demote current owner to admin
        if (role === 'owner') {
            const currentOwner = await ChannelMember.findOne({
                where: { channel_id: channelId, user_id: requesterId }
            });

            if (currentOwner) {
                await currentOwner.update({ role: 'admin' }, { transaction });
            }

            // Update channel owner_id
            await channel.update({ owner_id: userId }, { transaction });
        }

        // Update member role
        await member.update({ role }, { transaction });

        await transaction.commit();

        res.status(200).json({
            status: 'success',
            message: 'Member role updated successfully',
            data: {
                userId,
                newRole: role,
                previousOwnerId: role === 'owner' ? requesterId : null
            }
        });
    } catch (err) {
        await transaction.rollback();
        logger.error(`Failed to update member role: ${err.message}`);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
