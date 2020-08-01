const debug = require("debug")("yourtechy-oauth:oauth");

const JWT = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const env = require("../env");

const UserModel = require("./user");
let TokenModel = require("./token");

//////////////////////////////////////////////////////////////////////////////////////
// OAuth2 express-oauth-server - overloads token generation, persistence, validation
//////////////////////////////////////////////////////////////////////////////////////

let secret = null;

/**
 *  generateKey - jwt
 * @param {*} type
 * @param {*} client
 * @param {*} user
 */
const generateKey = (client, user) => {
  debug("ENTER generateKey");
  // set arguments
  const data = {
    created: Math.floor(Date.now() / 1000),
    userId: user._id,
    email: user.email,
    client: client.clientId,
    role: user.role,
  };
  const options = {
    issuer: env.jwt.issuer,
    expiresIn: env.jwt.access_token_expires,
    algorithm: env.jwt.algorithm,
  };

  if (!secret) {
    secret = fs.readFileSync(
      path.resolve(__dirname, "../.keys/private.key"),
      "utf8"
    );
  }

  // generate jwt access token
  return JWT.sign(data, secret, options);
};

/**
 * generateAccessToken = jwt
 *
 * @param {*} client
 * @param {*} user
 */
module.exports.generateAccessToken = async (client, user) => {
  debug("ENTER generateAccessToken()");
  // first - invalidate/delete previous access/refresh token.
  let result = await TokenModel.OAuthAccessTokenModel.deleteOne({
    user: user._id,
    client: client._id,
  });
  // now generate a new one
  return generateKey(client, user);
};

module.exports.getAccessToken = async (accessToken) => {
  debug("ENTER getAccessToken()");
  let _accessToken = await TokenModel.OAuthAccessTokenModel.findOne({
    accessToken: accessToken,
  })
    .populate("user")
    .populate("client");

  if (!_accessToken) {
    return false;
  }

  _accessToken = _accessToken.toObject();

  if (!_accessToken.user) {
    _accessToken.user = {};
  }
  return _accessToken;
};

module.exports.getRefreshToken = (refreshToken) => {
  debug("Enter oauth::getRefreshToken()");
  return TokenModel.OAuthAccessTokenModel.findOne({
    refreshToken: refreshToken,
  })
    .populate("user")
    .populate("client");
};

module.exports.getAuthorizationCode = (code) => {
  debug("Enter oauth::getAuthorizationCode()");
  return TokenModel.OAuthCodeModel.findOne({ authorizationCode: code })
    .populate("user")
    .populate("client");
};

module.exports.getClient = (clientId, clientSecret) => {
  debug("Enter oauth::getClient()");
  let params = { clientId: clientId };
  if (clientSecret) {
    params.clientSecret = clientSecret;
  }
  return TokenModel.OAuthClientModel.findOne(params);
};

module.exports.getUser = async (email, password) => {
  debug("Enter oauth::getUser()");
  let user = await UserModel.findOne({ email: email });
  if (user.validatePassword(password)) {
    return user;
  }
  return false;
};

module.exports.getUserFromClient = null;

module.exports.saveToken = async (new_token, client, user) => {
  debug("Enter oauth::saveToken()");
  let accessToken = (
    await TokenModel.OAuthAccessTokenModel.create({
      user: user.id || null,
      client: client.id,
      accessToken: new_token.accessToken,
      accessTokenExpiresAt: new_token.accessTokenExpiresAt,
      refreshToken: new_token.refreshToken,
      refreshTokenExpiresAt: new_token.refreshTokenExpiresAt,
      scope: new_token.scope,
    })
  ).toObject();

  if (!accessToken.user) {
    accessToken.user = {};
  }

  return accessToken;
};

module.exports.saveAuthorizationCode = (code, client, user) => {
  debug("Enter oauth::saveAuthorizationCode()");
  let authCode = new TokenModel.OAuthCodeModel({
    user: user.id,
    client: client.id,
    authorizationCode: code.authorizationCode,
    expiresAt: code.expiresAt,
    scope: code.scope,
  });
  return authCode.save();
};

module.exports.revokeToken = async (accessToken) => {
  debug("Enter oauth::revokeToken()");
  let result = await TokenModel.OAuthAccessTokenModel.deleteOne({
    refreshToken: accessToken.refreshToken,
  });
  return result.deletedCount > 0;
};

module.exports.revokeAuthorizationCode = async (code) => {
  debug("Enter oauth::revokeAuthorizationCode()");
  let result = await TokenModel.OAuthCodeModel.deleteOne({
    authorizationCode: code.authorizationCode,
  });
  return result.deletedCount > 0;
};
