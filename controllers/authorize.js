const { FORBIDDEN, OK } = require("http-status-codes")

const {
  unauthorizedError,
  loginRequiredError,
  authorizationError,
} = require("../lib/constants");

const logger = require("../lib/Logger");

/**
 *
 * @param opts
 */
modules.export.isAuthorized = (opts = {
  hasRole: ["SuperAdmin" | "Admin" | "Manager" | "Supervisor" | "Technician" | "User"]
}) => {
  return (req, res, next) => {
    logger.debug("Entering middleware::isAuthorized()");
    const redirectLogin = () => res.redirect("/");

    if (!res.locals.user) return redirectLogin();

    const { role, _id } = res.locals.user;

    if (!_id || !role) return redirectLogin();

    let isAuthorized = false;
    if (opts.hasRole.includes(role)) {
      isAuthorized = true;
    }

    let error = { error: "Unauthorized user" };
    let view = res.locals.view ? res.locals.view : "error";

    if ("sign-in" === view) {
      if (isAuthorized) {
        return res.redirect("/");
      }
    }

    if (isAuthorized) {
      return next();
    } else if ("error" === view) {
      error = {
        error: {
          status: "Unauthorized user",
        },
        message: "Requires admin access",
      };
    }

    return res.render(view, error);
  };
};

/**
 *
 * @param opts
 */
export const apiIsAuthorized = (opts = {
  hasRole: ["SuperAdmin" | "Admin" | "Manager" | "Supervisor" | "Technician" | "User"]
}) => {
  return (req, res, next) => {
    logger.debug("Enter middleware::apiIsAuthorized()");
    const redirectLogin = (msg) =>
      res.status(FORBIDDEN).json(msg ? msg : "Unauthorized access to resource");

    if (!res.locals.user) return redirectLogin(loginRequiredError);

    const { role } = res.locals.user;

    if (!role) return redirectLogin(unauthorizedError);

    if (undefined !== opts.hasRole.includes(role)) {
      return next();
    }

    logger.debug("Exit middleware::apiIsAuthorized() - authorization error");
    return redirectLogin(authorizationError);
  };
};
