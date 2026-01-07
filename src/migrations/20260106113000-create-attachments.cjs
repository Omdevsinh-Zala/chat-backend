"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("attachments", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            message_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "messages",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            sender_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            receiver_id: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            file_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            file_url: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            file_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            mime_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            file_size: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
            },
            version: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex("attachments", ["message_id"]);
        await queryInterface.addIndex("attachments", ["sender_id"]);
        await queryInterface.addIndex("attachments", ["receiver_id"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("attachments");
    },
};
