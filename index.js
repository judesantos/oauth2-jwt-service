require("./load-env") // Must be the first import
const env = require("./.env")

//
const app = require('./app')

/**
 * Module dependencies.
 */

const logger = require('./lib/logger')
const http = require('http')

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(env.serverPort)
app.set('port', port)

/**
 * Create HTTP server.
 */

var server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.debug(bind + ' requires elevated privileges. Exiting...')
      process.exit(1)
      break
    case 'EADDRINUSE':
      logger.debug(bind + ' is already in use. Exiting...')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  logger.info('Server started! Listening on ' + bind)
}
