const express = require("express");

const authorize = require("../controllers/authorize");
const authenticate = require("../controllers/authenticate");
const { find, findAll } = require("../controllers/users");

const router = express.Router();

router.get("/all", [
  authenticate.apiIsAuthenticated,
  authorize.apiIsAuthorized({
    hasRole: ["SuperAdmin", "Admin", "Manager", "Supervisor"],
  }),
  findAll,
]);

router.get("/", [
  authenticate.apiIsAuthenticated,
  authorize.apiIsAuthorized({
    hasRole: ["SuperAdmin", "Admin", "Manager", "Supervisor"],
  }),
  find,
]);

module.exports = router;
