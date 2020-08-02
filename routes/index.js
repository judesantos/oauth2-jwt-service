const router = require('express').Router()
const OAuthServer = require('express-oauth-server')
const OAuthModel = require('../models/oauth')
const env = require('../.env')

router.use(require('./oauth'))
router.use(require('./public'))

const service = router();
service.use(require('./users'));

router.use('/api/v1', service);


const oauth = new OAuthServer({
  model: OAuthModel,
  requireClientAuthentication: { password: true },
  debug: !env.isProduction
})

router.get('/test-auth', oauth.authenticate(), (req, res) => {
  res.json(res.locals)
})

module.exports = router
