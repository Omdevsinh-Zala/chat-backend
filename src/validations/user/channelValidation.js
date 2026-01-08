import Joi from 'joi';

export const createChannelValidators = Joi.object({
    title: Joi.string()
        .min(2)
        .max(20)
        .regex(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Title must not contain special characters or numbers.',
            'string.min': 'Title must be at least 2 characters long.',
            'string.max': 'Title must not exceed 20 characters.',
            'any.required': 'Title is required.',
        }),
    topic: Joi.string()
        .min(3)
        .max(50)
        .regex(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Topic must not contain special characters or numbers.',
            'string.min': 'Topic must be at least 3 characters long.',
            'string.max': 'Topic must not exceed 50 characters.',
            'any.required': 'Topic is required.',
        }),
    description: Joi.string()
        .min(3)
        .max(100)
        .regex(/^[a-zA-Z0-9\s_.-]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Description can only contain letters, numbers, spaces, underscores, and hyphens.',
            'string.min': 'Description must be at least 3 characters long.',
            'string.max': 'Description must not exceed 100 characters.',
            'any.required': 'Description is required.',
        }),
    isPrivate: Joi.boolean().required().messages({
        'any.required': 'Private option is required.',
    }),
})