const router = require('express').Router()
const OAuthServer = require('express-oauth-server')
const OAuthModel = require('../models/oauth')
const env = require('../env')

const oauth = new OAuthServer({
  model: OAuthModel,
  requireClientAuthentication: { password: true },
  debug: !env.isProduction
})

router.use(require('./oauth'))
router.use(require('./public'))

router.get('/test-auth', oauth.authenticate(), (req, res) => {
  return res.send(JSON.stringify(res.locals))
})

module.exports = router
