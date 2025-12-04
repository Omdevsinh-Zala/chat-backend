class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);

    this.success = false;
    this.status = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
