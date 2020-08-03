const fs = require("fs")
const env = require("../.env")
const JWT = require("jsonwebtoken")
const logger = require("../lib/logger")

const path = require("path")

const TOKEN_EXPIRED_ERROR = -1
const TOKEN_MISSING_ERROR = -2
const TOKEN_VALIDATION_ERROR = -3
const TOKEN_VALIDATION_SUCCESS = 0

// signature data - generate hash that must be identical to the token signature.
const options = {
  issuer: env.jwt.issuer,
  expiresIn: env.jwt.access_token_expires,
  algorithm: env.jwt.algorithm,
}

const secret = fs.readFileSync(
  path.resolve(__dirname, "../.keys/public.key"),
  "utf8"
)

const getToken = (auth) => {
  if (auth) {
    let tok = auth.split(" ")
    if (tok.length === 2) {
      return tok[1]
    }
  }
}

module.exports.authenticate = async (auth) => {
  logger.debug("Enter JwtService::authenticate()")

  let error = ""
  let status = TOKEN_VALIDATION_SUCCESS
  let _decoded = null

  let token = getToken(auth)

  if (!token) {
    status = TOKEN_MISSING_ERROR
  } else {
    // verify jwt access token
    await JWT.verify(token, secret, options, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          status = TOKEN_EXPIRED_ERROR
        } else {
          status = TOKEN_VALIDATION_ERROR
          error = err.message
        }
      } else {
        _decoded = decoded
        logger.debug(JSON.stringify({ decodedTokenData: decoded }))
        status = TOKEN_VALIDATION_SUCCESS
      }
    })
  }

  return {
    status: status,
    message: error,
    data: _decoded,
  }
}
