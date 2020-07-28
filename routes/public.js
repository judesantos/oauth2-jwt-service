const router = require('express').Router()
const DbContext = require('../db/context')
const crypto = require('crypto')
const { body, validationResult } = require('express-validator')

const OAuthModel = require('../models/oauth')

const env = require('../env')

const context = DbContext.useDb(env.mongoDb.oauth.name)

router.get('/', (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/sign-in')
  }
  res.render('index', {
    location: 'home',
    title: 'Yourtechy oauth2-jwt service.',
    user: req.session.user
  })
})

router.get('/sign-in', (req, res, next) => {
  req.session.destroy()
  res.render('sign-in')
})

router.post('/sign-in', async (req, res, next) => {
  let error = false
  if (!req.body.username || !req.body.username.length ||
    !req.body.password || !req.body.password.length
  ) {
    error = 'Invalid username or password input'
  } else {
    let UserModel = context.model('User')
    let user = await UserModel.findOne({ email: req.body.username })
    if (!user || !user.active) {
      error = 'User not found'
    } else {
      if (user.validatePassword(req.body.password)) {
        req.session.user = {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isAdmin: user.role === 'admin' ? true : false
        }
        return res.redirect('/')
      } else {
        error = 'Invalid username or password'
      }
    }
  }

  if (error.length) {
    res.render('sign-in', { error: error })
  }
})

router.get('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/')
})

router.get('/users', (req, res, next) => {
  // get users
  // show users
  res.render('users', {
    location: 'users',
    user: req.session.user,
    users: {}
  })
})

const createFormObjectMap = (frmElements, errors = null) => {
  let formMap = {};
  if (!Object.keys(frmElements).length) {
    throw new "createFormObjects error: element array is empty"
  }
  // create a map of form elements use element id as map key
  for (let key in frmElements) {
    let formItem = {
      value: frmElements[key],
      error: false,
      msg: ''
    }
    formMap[key] = formItem
  }
  // add error message of elements that failed validation
  for (let err of errors) {
    let map = formMap[err.param]
    if (map) {
      map.error = true;
      map.msg = err.msg
    }
  }

  return formMap
}

router.get('/register', (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/sign-in')
  }

  let params = {
    location: 'register',
    message: '',
    error: '',
    user: req.session.user,
  }
  if (req.session.form && Object.keys(req.session.form).length) {
    for (let key in req.session.form) {
      params[key] = req.session.form[key]
    }
    params['error'] = req.flash('error')
    req.session.form = {}
  } else {
    params['message'] = req.flash('message')
  }

  res.render('register', params)
})

router.post('/register', [
  // validate
  body('fullName', 'Full Name is required').notEmpty(),
  body('email').notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .custom(async (email) => {
      const UserModel = context.model('User')
      const user = await UserModel.findOne({ email: email })
      if (user) {
        return Promise.reject('Email account in use')
      }
    }
    ),
  body('password').trim().notEmpty().withMessage('Password is required').escape()
    .isLength({ min: 8 }).withMessage('Password must be 8 chars or more'),
  body('confirmPassword').notEmpty().withMessage('Confirm password required')
    .custom(async (pw, { req }) => {
      if (req.body.password !== pw) {
        return Promise.reject('Passwords does not match')
      }
    }
    ),
  body('role', 'User role is required').notEmpty(),
  body('clientId', 'Client id is required').notEmpty(),
  body('clientSecret', 'Client secret is required').notEmpty(),
  body('companyName', 'Company name is required').notEmpty(),
  body('hostName', 'Host name is required').notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    req.session.form = createFormObjectMap(req.body, errors.array());
    req.flash('error', 'Validation failed! Check form fields for errors.')

    return res.redirect('/register')
  }

  let UserModel = context.model('User')
  let OAuthClientModel = context.model('OAuthClient')

  // Create User
  let _user = new UserModel({
    fullName: req.body.fullName,
    email: req.body.email,
    role: req.body.role,
    verificationCode: crypto.randomBytes(16).toString('hex'),
    active: true
  })
  _user.setPassword(req.body.password)
  let user = null
  try {
    user = await _user.save()
  } catch (error) {
    return res.send(error.errmsg, 422)
  }

  if (!user) {
    return res.send('Error creating user', 422)
  }

  // Create OAuth Client
  let _client = await OAuthModel.getClient(
    req.body.clientId,
    req.body.clientSecret
  )

  if (!_client) {
    // Client - Avail of password, refresh token service
    _client = new OAuthClientModel({
      user: user.id,
      clientId: req.body.clientId,
      clientSecret: req.body.clientSecret,
      companyName: req.body.companyName,
      hostName: req.body.hostName,
      grants: [
        'refresh_token',
        'password'
      ]
    })
    _client.save()
  }

  req.flash('message', 'Registration successful!')

  return res.redirect('/register')
})

module.exports = router
