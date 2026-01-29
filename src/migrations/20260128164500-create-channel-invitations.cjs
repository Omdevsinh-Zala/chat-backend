'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('channel_invitations', {
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
            inviter_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            token: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            is_used: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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

        await queryInterface.addIndex('channel_invitations', ['token']);
        await queryInterface.addIndex('channel_invitations', ['channel_id']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable('channel_invitations');
    }
};
