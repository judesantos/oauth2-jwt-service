const express = require("express");
const OAuthServer = require("express-oauth-server");
const OAuthModel = require("../models/oauth");
const env = require("../.env");

const router = express.Router();

router.use(require("./oauth"));
router.use(require("./portal"));

const service = express.Router();

service.use("/users", require("./users"));

router.use("/api/v1", service);

const oauth = new OAuthServer({
  model: OAuthModel,
  requireClientAuthentication: { password: true },
  debug: !env.isProduction,
});

router.get("/test-auth", oauth.authenticate(), (req, res) => {
  res.json(res.locals);
});

module.exports = router;
