'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('blocked_users', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                unique: true,
                defaultValue: Sequelize.UUIDV4
            },
            blocker_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                comment: 'User who initiated the block'
            },
            blocked_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                comment: 'User who was blocked'
            },
            reason: {
                type: Sequelize.STRING(256),
                allowNull: true,
                comment: 'Optional reason for blocking'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            }
        });

        // Add unique constraint - can't block the same user twice
        await queryInterface.addConstraint('blocked_users', {
            fields: ['blocker_id', 'blocked_id'],
            type: 'unique',
            name: 'unique_blocker_blocked_pair'
        });

        // Add check constraint - can't block yourself
        await queryInterface.addConstraint('blocked_users', {
            type: 'check',
            fields: ['blocker_id', 'blocked_id'],
            where: {
                blocker_id: { [Sequelize.Op.ne]: Sequelize.col('blocked_id') }
            },
            name: 'check_no_self_block'
        });

        // Add indexes for performance
        await queryInterface.addIndex('blocked_users', ['blocker_id']);
        await queryInterface.addIndex('blocked_users', ['blocked_id']);
        await queryInterface.addIndex('blocked_users', ['blocker_id', 'created_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable('blocked_users');
    }
};
