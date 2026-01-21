'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addIndex('messages', ['receiver_id'], {
            name: 'messages_receiver_id_index'
        });
        await queryInterface.addIndex('messages', ['created_at'], {
            name: 'messages_created_at_index'
        });
        // Composite index for common query pattern: sender_id + receiver_id + created_at
        await queryInterface.addIndex('messages', ['sender_id', 'receiver_id', 'created_at'], {
            name: 'messages_sender_receiver_created_at_index'
        });

        await queryInterface.addIndex('attachments', ['message_id'], {
            name: 'attachments_message_id_index'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('messages', 'messages_receiver_id_index');
        await queryInterface.removeIndex('messages', 'messages_created_at_index');
        await queryInterface.removeIndex('messages', 'messages_sender_receiver_created_at_index');
        await queryInterface.removeIndex('attachments', 'attachments_message_id_index');
    }
};
