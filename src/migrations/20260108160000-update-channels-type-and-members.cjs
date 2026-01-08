'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('channels', 'only_admin_can_message', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether only admins are allowed to send messages in this channel'
    });

    await queryInterface.removeColumn('channels', 'type');
    await queryInterface.sequelize.query('DROP TYPE "enum_channels_type";');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('channels', 'only_admin_can_message');
    await queryInterface.addColumn('channels', 'type', {
      type: Sequelize.ENUM('public', 'private', 'dm', 'group', 'announcement'),
      defaultValue: 'public'
    });
  }
};
