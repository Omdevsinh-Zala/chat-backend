/**
 * Utility functions for creating standardized API responses.
 */
const createApiResponse = (
  success,
  data,
  status,
  message = null,
  errors = null,
  code = null
) => {
  const response = {
    success,
    status,
  };

  if (message !== undefined) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  if (code) {
    response.code = code;
  }

  return response;
};

/**
 * Sends a standardized success API response.
 */
export const successResponse = ({
  res,
  data = null,
  message = null,
  statusCode = 200,
}) => {
  return res
    .status(statusCode)
    .json(createApiResponse(true, data, statusCode, message));
};

/**
 * Sends a standardized error API response.
 */
export const errorResponse = ({
  res,
  message = null,
  statusCode = 500,
  details = null,
}) => {
  return res
    .status(statusCode)
    .json(createApiResponse(false, details, statusCode, message, null));
};
