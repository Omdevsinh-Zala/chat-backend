'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('channel_members', 'last_read_at', {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'The timestamp of the last message read by the user in this channel'
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('channel_members', 'last_read_at');
    }
};
