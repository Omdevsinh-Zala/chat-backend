import Joi from "joi";

export const validateUsername = Joi.object({
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
          })
});