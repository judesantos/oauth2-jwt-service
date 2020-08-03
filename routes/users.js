const express = require("express");

const authorize = require("../controllers/authorize");
const authenticate = require("../controllers/authenticate");
const { find, update } = require("../controllers/users");

const router = express.Router();

/**
 * Find user
 */
router.get("/", [
  authenticate.apiIsAuthenticated,
  authorize.apiIsAuthorized({
    hasRole: ["SuperAdmin", "Admin", "Manager", "Supervisor"],
  }),
  find,
]);

/**
 * Update user
 */
router.put("/", [
  authenticate.apiIsAuthenticated,
  authorize.apiIsAuthorized({
    hasRole: [
      "SuperAdmin",
      "Admin",
      "Manager",
      "Supervisor",
      "Technician",
      "User",
    ],
  }),
  update,
]);

module.exports = router;
