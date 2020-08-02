// Strings
module.exports.paramMissingError = "Missing required arguments.";
module.exports.invalidArgumentError = "Invalid argument";
module.exports.loginMissingUserPassErr = "Missing username or password";
module.exports.loginFailedErr = "Login failed";
module.exports.loginPasswordError = "Password validation failed";
module.exports.loginInvalidUsernamePass = "Invalid username or password";

module.exports.unauthorizedError = "User unauthorized to access this resource";
module.exports.authorizationError = "Can not verify user authorization";
module.exports.loginRequiredError = "Login required to access resource";
module.exports.authenticationError = "Missing authorization in request";
module.exports.invalidAuthError = "Invalid authorization";
module.exports.invalidAuthFormatError = "Invalid authorization format.";

module.exports.tokenExpiredError = "TokenExpired";
module.exports.tokenMisingError = "TokenMissing";
module.exports.tokenInvalidError = "TokenInvalid";

module.exports.serverError = "Server error";

// Numbers
//module.exports.pwdSaltRounds = 12;

// Cookie Properties
module.exports.cookieProps = Object.freeze({
  key: "ExpressGeneratorTs",
  secret: process.env.COOKIE_SECRET,
  options: {
    httpOnly: true,
    signed: true,
    path: process.env.COOKIE_PATH,
    maxAge: Number(process.env.COOKIE_EXP),
    domain: process.env.COOKIE_DOMAIN,
    secure: process.env.SECURE_COOKIE === "true",
  },
});
