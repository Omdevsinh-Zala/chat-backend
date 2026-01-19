/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('settings', 'mat_theme', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'azure-theme',
            after: 'description'
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('settings', 'mat_theme');
    }
};
