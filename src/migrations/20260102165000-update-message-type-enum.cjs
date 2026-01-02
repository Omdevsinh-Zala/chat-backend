'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.sequelize.query("ALTER TYPE \"enum_messages_message_type\" ADD VALUE 'mixed';").catch(() => { });
            await queryInterface.sequelize.query("ALTER TYPE \"enum_messages_message_type\" ADD VALUE 'pdf';").catch(() => { });
        } catch (e) {
            console.log('Could not alter enum type directly, might be SQLite or values exist', e);
        }

        await queryInterface.changeColumn('messages', 'message_type', {
            type: Sequelize.ENUM("text", "image", "video", "file", "audio", "system", "pdf", "mixed"),
            allowNull: true,
            defaultValue: null
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('messages', 'message_type', {
            type: Sequelize.ENUM("text", "image", "video", "file", "audio", "system"),
            allowNull: false,
            defaultValue: "text"
        });
    }
};
