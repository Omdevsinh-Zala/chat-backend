'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('channel_members', {
      id: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      channel_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'channels', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM,
        values: ["member", "admin", "owner"],
        allowNull: false,
        defaultValue: "member",
        comment: 'Role of the user in the channel'
      },
      is_muted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      mute_until: {
        type: Sequelize.DATE
      },
      joined_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      invite_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ban_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      custom_data: {
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add unique constraint to prevent duplicate memberships
    await queryInterface.addConstraint('channel_members', {
      fields: ['channel_id', 'user_id'],
      type: 'unique',
      name: 'unique_channel_user_membership'
    });

    // Add indexes for performance
    await queryInterface.addIndex('channel_members', ['channel_id']);
    await queryInterface.addIndex('channel_members', ['user_id']);
    await queryInterface.addIndex('channel_members', ['channel_id', 'is_active']);
    await queryInterface.addIndex('channel_members', ['user_id', 'is_active']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('channel_members');
  }
};