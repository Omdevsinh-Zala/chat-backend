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
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'channels', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      receiver_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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
        values: ["text", "file", "system", "mixed"],
        defaultValue: "text"
      },
      reply_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
    }, {
      // Table-level constraint: must have either channel_id OR receiver_id
      // This is handled at application level for SQLite compatibility
    });

    // Add indexes for performance
    await queryInterface.addIndex('messages', ['channel_id']);
    await queryInterface.addIndex('messages', ['sender_id']);
    await queryInterface.addIndex('messages', ['receiver_id']);
    await queryInterface.addIndex('messages', ['created_at']);
    await queryInterface.addIndex('messages', ['channel_id', 'created_at']);
    await queryInterface.addIndex('messages', ['sender_id', 'receiver_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  }
};