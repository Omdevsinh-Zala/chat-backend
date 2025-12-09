import Joi from 'joi';

export const registerValidators = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(20)
        .regex(/^[a-zA-Z]+$/)
        .required()
        .messages({
            'string.pattern.base': 'First name must not contain special characters or numbers.',
            'string.min': 'First name must be at least 2 characters long.',
            'string.max': 'First name must not exceed 20 characters.',
            'any.required': 'First name is required.',
        }),
    lastName: Joi.string()
        .min(2)
        .max(20)
        .regex(/^[a-zA-Z]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Last name must not contain special characters or numbers.',
            'string.min': 'Last name must be at least 2 characters long.',
            'string.max': 'Last name must not exceed 20 characters.',
            'any.required': 'Last name is required.',
        }),
    username: Joi.string()
        .min(3)
        .max(32)
        .regex(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
            'string.min': 'Username must be at least 3 characters long.',
            'string.max': 'Username must not exceed 32 characters.',
            'any.required': 'Username is required.',
        }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format.',
        'any.required': 'Email is required.',
    }),
    password: Joi.string()
        .min(8)
        .max(16)
        .regex(/^(?!.*<script>)(?!.*[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]).*$/u)
        .required()
        .messages({
            'string.pattern.base': 'Password contains invalid characters.',
            'string.empty': 'Password cannot be empty.',
            'string.min': 'Password must be at least 8 characters long.',
            'string.max': 'Password must not exceed 16 characters.',
            'any.required': 'Password is required.',
        }),
})