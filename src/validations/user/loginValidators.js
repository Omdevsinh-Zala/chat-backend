import Joi from 'joi';

export const loginValidators = Joi.object({
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