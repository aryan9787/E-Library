const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    return next();
  } catch (error) {
    if (error.errors) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      return next(new ApiError(400, `Validation Error: ${errorMessages.join(', ')}`, error.errors));
    }
    return next(new ApiError(400, error.message || 'Invalid Request Data'));
  }
};

module.exports = validate;
