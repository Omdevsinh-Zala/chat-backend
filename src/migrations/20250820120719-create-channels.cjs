'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('channels', {
      id: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      title: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      avatar_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      topic: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      description: {
        type: Sequelize.TEXT
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      type: {
        type: Sequelize.ENUM,
        values: ["public", "private", "dm", "group", "announcement"],
        defaultValue: "public"
      },
      admin_ids: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: true,
        defaultValue: [],
        comment: 'List of user IDs with admin rights for this channel'
      },
      status: {
        type: Sequelize.ENUM,
        values: ["active", "archived", "locked", "deleted"],
        defaultValue: "active"
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
      }
    });
    await queryInterface.addIndex('channels', ['owner_id']);
    await queryInterface.addIndex('channels', ['type']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('channels');
  }
};