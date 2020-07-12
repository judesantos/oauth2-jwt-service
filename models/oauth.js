const JWT = require('jsonwebtoken')
const fs = require('fs')
const path = require("path")

const DbContext = require('../db/context')
const env = require('../env')

//////////////////////////////////////////////////////////////////////////////////////
// OAuth2 schema models
//////////////////////////////////////////////////////////////////////////////////////
const oauthDb = DbContext.useDb(env.mongoDb.oauth.name);

let OAuthAccessTokenModel = oauthDb.model('OAuthAccessToken', new oauthDb.Schema({
  user: { type: oauthDb.Schema.Types.ObjectId, ref: 'User' },
  client: { type: oauthDb.Schema.Types.ObjectId, ref: 'OAuthClient' },
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  refreshToken: { type: String },
  refreshTokenExpiresAt: { type: Date },
  scope: { type: String }
}, {
  timestamps: true
}), 'oauth_access_tokens')

let OAuthCodeModel = oauthDb.model('OAuthCode', new oauthDb.Schema({
  user: { type: oauthDb.Schema.Types.ObjectId, ref: 'User' },
  client: { type: oauthDb.Schema.Types.ObjectId, ref: 'OAuthClient' },
  authorizationCode: { type: String },
  expiresAt: { type: Date },
  scope: { type: String }
}, {
  timestamps: true
}), 'oauth_auth_codes')

let OAuthClientModel = oauthDb.model('OAuthClient', new oauthDb.Schema({
  user: { type: oauthDb.Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: String },
  clientSecret: { type: String },
  grants: { type: Array },
}, {
  timestamps: true
}), 'oauth_clients')

//////////////////////////////////////////////////////////////////////////////////////
// OAuth2 express-oauth-server - overloads token generation, persistence, validation
//////////////////////////////////////////////////////////////////////////////////////

/**
 *  generateKey - jwt
 * @param {*} type
 * @param {*} client
 * @param {*} user
 */
const generateKey = (client, user) => {
  // set arguments
  const data = {
    iat: new Date().getTime(),
    clientId: client.clientId,
    userId: user._id,
    email: user.email,
    client: client.clientId
  }
  const options = {
    issuer: env.jwt.issuer,
    expiresIn: env.jwt.access_token_expires,
    algorithm: env.jwt.algorithm
  }
  const secret = fs.readFileSync(path.resolve(__dirname, '../.keys/private.key'), 'utf8')
  // generate jwt access token
  return JWT.sign(data, secret, options)
}


/**
 * generateAccessToken = jwt
 *
 * @param {*} client
 * @param {*} user
 */
module.exports.generateAccessToken = async (client, user) => {
  // first - invalidate/delete previous access/refresh token.
  let result = await OAuthAccessTokenModel.deleteOne({
    user: user._id,
    client: client._id
  })
  // now generate a new one
  return generateKey(client, user)
}

module.exports.getAccessToken = async (accessToken) => {
  let _accessToken = await OAuthAccessTokenModel.findOne({ accessToken: accessToken })
    .populate('user')
    .populate('client')

  if (!_accessToken) {
    return false
  }

  _accessToken = _accessToken.toObject()

  if (!_accessToken.user) {
    _accessToken.user = {}
  }
  return _accessToken
}

module.exports.getRefreshToken = (refreshToken) => {
  return OAuthAccessTokenModel.findOne({ refreshToken: refreshToken })
    .populate('user')
    .populate('client')
}

module.exports.getAuthorizationCode = (code) => {
  return OAuthCodeModel.findOne({ authorizationCode: code })
    .populate('user')
    .populate('client')
}

module.exports.getClient = (clientId, clientSecret) => {
  let params = { clientId: clientId }
  if (clientSecret) {
    params.clientSecret = clientSecret
  }
  return OAuthClientModel.findOne(params)
}

module.exports.getUser = async (email, password) => {
  let UserModel = mongoose.model('User')
  let user = await UserModel.findOne({ email: email })
  if (user.validatePassword(password)) {
    return user
  }
  return false
}

module.exports.getUserFromClient = null

module.exports.saveToken = async (token, client, user) => {
  let accessToken = (await OAuthAccessTokenModel.create({
    user: user.id || null,
    client: client.id,
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    scope: token.scope,
  })).toObject()

  if (!accessToken.user) {
    accessToken.user = {}
  }

  return accessToken
}

module.exports.saveAuthorizationCode = (code, client, user) => {
  let authCode = new OAuthCodeModel({
    user: user.id,
    client: client.id,
    authorizationCode: code.authorizationCode,
    expiresAt: code.expiresAt,
    scope: code.scope
  })
  return authCode.save()
}

module.exports.revokeToken = async (accessToken) => {
  let result = await OAuthAccessTokenModel.deleteOne({
    refreshToken: accessToken.refreshToken
  })
  return result.deletedCount > 0
}

module.exports.revokeAuthorizationCode = async (code) => {
  let result = await OAuthCodeModel.deleteOne({
    authorizationCode: code.authorizationCode
  })
  return result.deletedCount > 0
}
