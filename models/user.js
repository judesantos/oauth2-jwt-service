const bcrypt = require("bcrypt");

const DbContext = require("../db/context");
const env = require("../.env");

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
    client: { type: oauthDb.Schema.Types.ObjectId, ref: "OAuthClient" },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.setPassword = function (password) {
  const salt = bcrypt.genSaltSync();
  this.password = bcrypt.hashSync(password, salt);
};

module.exports = oauthDb.model("User", UserSchema, "users");
