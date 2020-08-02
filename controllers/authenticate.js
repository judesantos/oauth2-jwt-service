const { OK, UNAUTHORIZED, FORBIDDEN } = require("http-status-codes");
const {
  authenticationError,
  invalidAuthError,
  invalidAuthFormatError,
  tokenInvalidError,
  tokenMisingError,
  tokenExpiredError,
  loginRequiredError,
} = require("../lib/constants");

const JwtService = require("../lib/jwtservice");
const logger = require("../lib/logger");

module.exports.isAuthenticated = async (req, res) => {
  logger.debug("Entering middleware::isAuthenticated()");

  const { authorization } = req.headers;

  if (!authorization) {
    return {
      status: FORBIDDEN,
      message: authenticationError,
    };
  }

  if (!authorization.startsWith("Bearer")) {
    return {
      status: FORBIDDEN,
      message: invalidAuthError,
    };
  }

  const split = authorization.split("Bearer ");

  if (split.length !== 2) {
    return {
      status: FORBIDDEN,
      message: invalidAuthFormatError,
    };
  }

  const jwtRet = await JwtService.authenticate(authorization);

  if (jwtRet.status == JwtService.TOKEN_EXPIRED_ERROR) {
    return {
      status: UNAUTHORIZED,
      message: tokenExpiredError,
    };
  } else if (jwtRet.status == JwtService.TOKEN_MISSING_ERROR) {
    return {
      status: FORBIDDEN,
      message: tokenMisingError,
    };
  } else if (jwtRet.status == JwtService.TOKEN_VALIDATION_ERROR) {
    return {
      status: FORBIDDEN,
      message: tokenInvalidError,
    };
  }

  return {
    status: OK,
    data: jwtRet,
  };
};

module.exports.apiIsAuthenticated = async (req, res, next) => {
  logger.debug("Enter middleware::apiIsAuthenticated()");

  const ret = await this.isAuthenticated(req, res);

  if (OK !== ret.status) {
    return res.status(ret.status).json(ret.message);
  }

  res.locals.user = ret.data.data;

  logger.debug("Exit middleware::apiIsAuthenticated()");
  next();
};
