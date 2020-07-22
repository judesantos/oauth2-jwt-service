const debug = require('debug')('yourtechy-oauth2:oauth')
const router = require('express').Router()
const OAuthServer = require('express-oauth-server')
const OAuthModel = require('../models/oauth')

const env = require('../env')
const { NotExtended } = require('http-errors')

/////////////////////////////////////////////////////////////////////
// Server - Supports password, refresh token grant
// options:
//    grants: [
//      'authorization_code',
//      'client_credentials',
//      'refresh_token',
//      'password'
//    ]
/////////////////////////////////////////////////////////////////////
const oauth = new OAuthServer({
  model: OAuthModel,
  grants: ['password', 'refresh_token'],
  accessTokenLifetime: env.jwt.access_token_expires,
  refreshTokenLifetime: env.jwt.refresh_token_expires,
  debug: !env.isProduction
})
/**
 * password authentication grant
 *
 * Ex.:
 *   curl http://localhost:3000/oauth/access_token \
 *    -d "grant_type=password" \
 *    -d "username=username" \
 *    -d "password=password" \
 *    -H "Authorization: Basic base64'd-client:secret" \
 *    -H "Content-Type: application/x-www-form-urlencoded"
 */
router.post('/oauth/access_token', oauth.token())
/**
 * refresh token
 *
 * Ex.:
 *  curl http://localhost:3000/oauth/refresh_token \
 *    -d "grant_type=refresh_token" \
 *    -d "refresh_token=67c8300ad53efa493c2278acf12d92bdb71832f9" \
 *    -H "Authorization: Basic YXBwbGljYXRpb246c2VjcmV0" \
 *    -H "Content-Type: application/x-www-form-urlencoded"
 */
router.post('/oauth/refresh_token', oauth.token())

module.exports = router
