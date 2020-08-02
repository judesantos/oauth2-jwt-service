const logger = require('./lib/logger')
const path = require("path");
const fs = require('fs')

const cors = require("cors");
const express = require("express");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const session = require("express-session");
const sassMiddleware = require("node-sass-middleware");

// load app

const app = express();

// load app environment

const env = require("./.env");
const DbContext = require("./db/context")

/**
 * App dependencies
 */

// use morgan for http tracing

const morgan = require("morgan");

if (env.isProduction) {
  // log to file in production
  app.use(morgan('common', {
    skip: function (req, res) { return res.statusCode === 200 },
    stream: fs.createWriteStream(path.join(__dirname, env.logging.commonLogPath), { flags: 'a' })
  }))
  app.use(morgan('errors', {
    skip: function (req, res) { return res.statusCode > 200 },
    stream: fs.createWriteStream(path.join(__dirname, env.logging.errorLogPath), { flags: 'a' })
  }))
} else {
  // log to console in dev
  app.use(morgan('dev'));
}

// handlerbars view engine setup

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
require("./utils/hbs-helpers");

// parse application/x-www-form-urlencoded

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// session config

app.use(
  session({
    secret: env.salt,
    cookie: { maxAge: 60000, secure: false },
    saveUninitialized: true,
    resave: false,
  })
);
app.use(
  sassMiddleware({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  })
);
app.use(cors());
app.use(flash());
app.use(express.json());
//app.use(cookieParser())
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// connect to DB, setup routes on success.

DbContext.init().then((success) => {
  if (!success) {
    logger.debug("Server initialization failed! Exeunt...");
    return;
  }
  require("./models/oauth");

  // setup routes

  app.use(require("./routes"));

  // handle 404 error, send to error handler

  app.use(function (req, res, next) {
    if (false !== req.url.indexOf("access_token")) {
      return res.status(400).send("Server error occurred");
    }
    next(createError(404));
  });

  // system error handler

  app.use((err, req, res, next) => {
    logger.debug('Error catch all...')
    // show errors on non-prod deployment
    res.locals.message = err.message;
    res.locals.error = !env.isProduction ? err : {};
    // show error page
    res.status(err.status || 500);
    res.render("error");
  });
});

module.exports = app;
