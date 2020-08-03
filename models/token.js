const DbContext = require('../db/context')
const env = require('../.env')

//////////////////////////////////////////////////////////////////////////////////////
// token schema models
//////////////////////////////////////////////////////////////////////////////////////

const oauthDb = DbContext.useDb(env.mongoDb.oauth.name)

const OAuthAccessTokenModel = oauthDb.model('OAuthAccessToken', new oauthDb.Schema({
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

const OAuthCodeModel = oauthDb.model('OAuthCode', new oauthDb.Schema({
  user: { type: oauthDb.Schema.Types.ObjectId, ref: 'User' },
  client: { type: oauthDb.Schema.Types.ObjectId, ref: 'OAuthClient' },
  authorizationCode: { type: String },
  expiresAt: { type: Date },
  scope: { type: String }
}, {
  timestamps: true
}), 'oauth_auth_codes')

OAuthClientModel = oauthDb.model('OAuthClient', new oauthDb.Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  grants: { type: Array },
}, {
  timestamps: true
}), 'oauth_clients')

module.exports = {
  OAuthCodeModel: OAuthCodeModel,
  OAuthClientModel: OAuthClientModel,
  OAuthAccessTokenModel: OAuthAccessTokenModel
}
