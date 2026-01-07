'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'User receiving the notification'
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'User who triggered the notification (null for system notifications)'
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'channels', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Related channel (nullable - not all notifications are channel-related)'
      },
      message_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Related message (nullable - not all notifications are message-related)'
      },
      type: {
        type: Sequelize.ENUM,
        values: ["message", "mention", "reaction", "invite", "system", "reminder", "alert"],
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      device_type: {
        type: Sequelize.ENUM,
        values: ["web", "mobile", "desktop"],
        allowNull: true
      },
      is_delivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: Sequelize.ENUM,
        values: ["low", "normal", "high"],
        defaultValue: "normal"
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['expires_at']);
    await queryInterface.addIndex('notifications', ['sender_id']);
    await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at']);
    await queryInterface.addIndex('notifications', ['type']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  }
};