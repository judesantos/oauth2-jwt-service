// depends
const cors = require('cors')
const path = require('path')
const logger = require('morgan')
const express = require('express')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const createError = require('http-errors')
const session = require('express-session')
//const cookieParser = require('cookie-parser')
const sassMiddleware = require('node-sass-middleware')

// load app environment
const env = require('./env')
const DbContext = require('./db/context')

// load, configure express

const app = express()

// handlerbars view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')
require('./utils/hbs-helpers')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
// session config
app.use(session({
  secret: env.salt,
  cookie: { maxAge: 60000, secure: false },
  saveUninitialized: true,
  resave: true
}))
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}))
app.use(cors())
app.use(flash())
app.use(logger('dev'))
app.use(express.json())
//app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

/*
* db settings
*/

DbContext.init().then(success => {
  if (!success) {
    console.error("Server initialization failed! Exeunt...")
    return
  }
  // load DB models
  require('./models/user')
  require('./models/oauth')

  app.use(require('./routes'))

  // handle 404 error, send to error handler
  app.use(function (req, res, next) {
    next(createError(404))
  })

  // system error handler

  app.use(function (err, req, res, next) {
    // show errors on non-prod deployment
    res.locals.message = err.message
    res.locals.error = !env.isProduction ? err : {}
    // show error page
    res.status(err.status || 500)
    res.render('error')
  })

  console.log('Server started! Listening on port 3000...')
})

module.exports = app
