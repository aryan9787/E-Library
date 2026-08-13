const ApiError = require('../utils/ApiError');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before role check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Role '${req.user.role}' is not authorized to access this resource.`)
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };
