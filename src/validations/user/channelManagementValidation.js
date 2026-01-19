import Joi from "joi";

export const updateMemberRoleValidators = Joi.object({
    role: Joi.string().valid('member', 'admin', 'owner').required()
});
