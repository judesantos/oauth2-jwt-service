const crypto = require("crypto");
const bcrypt = require("bcrypt");

const DbContext = require("../db/context");
const env = require("../env");
const debug = require("debug")("yourtechy-oauth2:user");

const oauthDb = DbContext.useDb(env.mongoDb.oauth.name);

const UserSchema = new oauthDb.Schema(
  {
    fullName: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    role: { type: String },
    verificationCode: { type: String },
    verifiedAt: { type: Date },
    active: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.setPassword = function (password) {
  const salt = bcrypt.genSaltSync();
  this.password = bcrypt.hashSync(password, salt);
};

module.exports = oauthDb.model("User", UserSchema, "users");
