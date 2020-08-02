const express = require("express");

const apiIsAuthorized = require("../controllers/Authorize");
const apiIsAuthenticated = require("../controllers/Authenticate");
const { find, findAll } = require("../controllers/Users");

const router = express.Router();

router.get("/all", [
  apiIsAuthenticated,
  apiIsAuthorized({
    hasRole: ["SuperAdmin", "Admin", "Manager", "Supervisor"],
  }),
  findAll,
]);

router.get("/", [
  apiIsAuthenticated,
  apiIsAuthorized({
    hasRole: ["SuperAdmin", "Admin", "Manager", "Supervisor"],
  }),
  find,
]);

module.exports = router;
