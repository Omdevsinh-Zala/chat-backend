import Joi from "joi";

export const updateSettingsValidators = Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system').optional(),
    language: Joi.string().valid('english', 'spanish', 'french', 'german', 'hindi', 'chinese', 'japanese').optional(),
    notification_sound: Joi.string().valid('default', 'chime', 'ding', 'sciClick', 'beep', 'none').optional(),
    push_enabled: Joi.boolean().optional(),
    email_notifications: Joi.boolean().optional(),
    mat_theme: Joi.string().optional()
});
