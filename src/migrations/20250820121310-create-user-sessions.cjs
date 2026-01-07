'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_sessions', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                unique: true,
                defaultValue: Sequelize.UUIDV4
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                comment: 'User who owns this session'
            },
            socket_id: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Socket.io connection ID for real-time messaging'
            },
            device_type: {
                type: Sequelize.ENUM,
                values: ["web", "mobile", "desktop"],
                allowNull: false,
                defaultValue: "web"
            },
            device_info: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'Device details like browser, OS, version'
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            is_online: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Whether this specific session is currently active'
            },
            last_activity_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Session expiration time for automatic cleanup'
            }
        });

        // Add indexes for performance
        await queryInterface.addIndex('user_sessions', ['user_id']);
        await queryInterface.addIndex('user_sessions', ['socket_id']);
        await queryInterface.addIndex('user_sessions', ['user_id', 'is_online']);
        await queryInterface.addIndex('user_sessions', ['expires_at']);
    },
    async down(queryInterface) {
        await queryInterface.dropTable('user_sessions');
    }
};
