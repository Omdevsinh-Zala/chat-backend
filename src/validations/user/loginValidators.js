import Joi from 'joi';

export const loginValidators = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format.',
        'any.required': 'Email is required.',
    }),
    password: Joi.string().min(8).max(16).required().messages({
        'string.empty': 'Password cannot be empty.',
        'string.min': 'Password must be at least 8 characters long.',
        'string.max': 'Password must not exceed 16 characters.',
        'any.required': 'Password is required.',
    }),
})