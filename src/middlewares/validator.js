export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, {
      abortEarly: false,
      context: req.joiContext || {},
      stripUnknown: true,
    });
    next();
  } catch (error) {
    if (error.isJoi) {
      const fieldErrors = {};
      error.details.forEach((detail) => {
        const field = detail.path[0];
        if (!fieldErrors[field]) {
          fieldErrors[field] = detail.message;
        }
      });

      return res.status(400).json(fieldErrors);
    }
    return res.status(500).json(error.message);
  }
};