'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      channel_id: {
        type: Sequelize.UUID,
        references: { model: 'channels', key: 'id' }
      },
      receiver_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' }
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM,
        values: ["sending", "sent", "delivered", "read", "failed"],
        defaultValue: "sending"
      },
      message_type: {
        type: Sequelize.ENUM,
        values: ["text", "image", "video", "file", "audio", "system"],
        defaultValue: "text"
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      reply_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'messages', key: 'id' }
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reactions: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });
    await queryInterface.addIndex('messages', ['channel_id']);
    await queryInterface.addIndex('messages', ['sender_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  }
};