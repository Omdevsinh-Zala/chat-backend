/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Add a temporary column with the new ENUM type
        await queryInterface.addColumn('settings', 'notification_sound_new', {
            type: Sequelize.ENUM('default', 'chime', 'ding', 'sciClick', 'beep', 'none'),
            allowNull: true,
            defaultValue: 'default'
        });

        // Step 2: Copy data from old column to new column
        await queryInterface.sequelize.query(`
      UPDATE settings 
      SET notification_sound_new = notification_sound::text::enum_settings_notification_sound_new
    `);

        // Step 3: Drop the old column
        await queryInterface.removeColumn('settings', 'notification_sound');

        // Step 4: Rename the new column to the original name
        await queryInterface.renameColumn('settings', 'notification_sound_new', 'notification_sound');

        // Step 5: Drop the old ENUM type (it might still exist)
        await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_settings_notification_sound_old" CASCADE
    `);
    },

    async down(queryInterface, Sequelize) {
        // Revert: Create temporary column with old ENUM values
        await queryInterface.addColumn('settings', 'notification_sound_old', {
            type: Sequelize.ENUM('default', 'chime', 'ding', 'none'),
            allowNull: true,
            defaultValue: 'default'
        });

        // Copy data, defaulting unsupported values to 'default'
        await queryInterface.sequelize.query(`
      UPDATE settings 
      SET notification_sound_old = CASE 
        WHEN notification_sound IN ('default', 'chime', 'ding', 'none') THEN notification_sound::text::enum_settings_notification_sound_old
        ELSE 'default'::enum_settings_notification_sound_old
      END
    `);

        // Drop the new column
        await queryInterface.removeColumn('settings', 'notification_sound');

        // Rename back
        await queryInterface.renameColumn('settings', 'notification_sound_old', 'notification_sound');
    }
};
