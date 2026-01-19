"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("push_subscriptions", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            subscription: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            device_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addIndex("push_subscriptions", ["user_id"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("push_subscriptions");
    },
};
