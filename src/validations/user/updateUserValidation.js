import Joi from "joi";

export const updateUserValidation = Joi.object({
    first_name: Joi.string()
        .min(3)
        .max(32)
        .messages({
            'string.min': 'First name must be at least 3 characters long.',
            'string.max': 'First name must not exceed 32 characters.',
        }),
    last_name: Joi.string()
        .min(3)
        .max(32)
        .messages({
            'string.min': 'Last name must be at least 3 characters long.',
            'string.max': 'Last name must not exceed 32 characters.',
        }),
    username: Joi.string()
        .min(3)
        .max(32)
        .regex(/^[a-zA-Z0-9_]+$/)
        .messages({
            'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
            'string.min': 'Username must be at least 3 characters long.',
            'string.max': 'Username must not exceed 32 characters.',
        }),
    avatar_url: Joi.string().messages({
        'string.empty': 'Avatar URL cannot be empty.',
    }),
    old_password: Joi.string()
        .min(8)
        .max(16)
        .regex(/^(?!.*<script>)(?!.*[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]).*$/u)
        .messages({
            'string.pattern.base': 'Old password contains invalid characters.',
            'string.empty': 'Old password cannot be empty.',
            'string.min': 'Old password must be at least 8 characters long.',
            'string.max': 'Old password must not exceed 16 characters.',
        }),
    new_password: Joi.string()
        .min(8)
        .max(16)
        .regex(/^(?!.*<script>)(?!.*[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]).*$/u)
        .messages({
            'string.pattern.base': 'New password contains invalid characters.',
            'string.empty': 'New password cannot be empty.',
            'string.min': 'New password must be at least 8 characters long.',
            'string.max': 'New password must not exceed 16 characters.',
        }),
}).and('old_password', 'new_password')