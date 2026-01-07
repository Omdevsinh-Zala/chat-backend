import AppError from "../utils/appError.js";

export const validate =
  (schema, source = "body") =>
  async (req, res, next) => {
    try {
      const schemaToValidate =
        typeof schema === "function" ? schema(req.locale || "en", req) : schema;
      const value = await schemaToValidate.validateAsync(req[source], {
        abortEarly: false,
        context: { ...(req.joiContext || {}), locale: req.locale || "en" },
        stripUnknown: true,
      });
      if (!req[source]) {
        req[source] = value;
      } else {
        Object.assign(req[source], value);
      }
      next();
    } catch (error) {
      if (error.isJoi) {
        const fieldErrors = {};
        error.details.forEach((detail) => {
          const field =
            detail.path[0] ||
            detail?.context?.missing?.[0] ||
            detail?.context?.field;
          if (!fieldErrors[field]) {
            fieldErrors[field] = detail?.context?.customErrors
              ? Object.values(detail.context.customErrors)[0]
              : detail.message;
          }
        });
        const message = "Validation failed";
        return next(new AppError(message, 422, fieldErrors));
      }
      next(error);
    }
  };