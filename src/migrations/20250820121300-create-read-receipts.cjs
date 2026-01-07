'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('read_receipts', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                unique: true,
                defaultValue: Sequelize.UUIDV4
            },
            message_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'messages', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                comment: 'Message that was read'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                comment: 'User who read the message'
            },
            read_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            }
        });

        // Add unique constraint - each user can only read a message once
        await queryInterface.addConstraint('read_receipts', {
            fields: ['message_id', 'user_id'],
            type: 'unique',
            name: 'unique_message_user_read'
        });

        // Add indexes for performance
        await queryInterface.addIndex('read_receipts', ['message_id']);
        await queryInterface.addIndex('read_receipts', ['user_id']);
        await queryInterface.addIndex('read_receipts', ['message_id', 'read_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable('read_receipts');
    }
};
