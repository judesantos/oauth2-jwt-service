const crypto = require('crypto')

const DbContext = require('../db/context')
const env = require('../env')

const oauthDb = DbContext.useDb(env.mongoDb.oauth.name)

const UserSchema = new oauthDb.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String },
  verificationCode: { type: String },
  verifiedAt: { type: Date },
  active: { type: Boolean }
}, {
  timestamps: true,
})

UserSchema.methods.validatePassword = function (password) {
  let _password = crypto.pbkdf2Sync(password, env.salt, 10000, 32, 'sha512')
    .toString('hex')
  return this.password === _password
}

UserSchema.methods.setPassword = function (password) {
  this.password = crypto.pbkdf2Sync(password, env.salt, 10000, 32, 'sha512')
    .toString('hex')
}

module.exports = oauthDb.model('User', UserSchema, 'users')
