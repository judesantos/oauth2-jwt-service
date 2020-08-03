const {
  BAD_REQUEST,
  CREATED,
  OK,
  NOT_ACCEPTABLE,
  METHOD_ERROR,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
} = require("http-status-codes");

const {
  paramMissingError,
  invalidArgumentError,
  missingIdError,
  invalidEmail,
  invalidAuthError,
  noEntriesFound,
  serverError,
  updateSuccess,
  missingArgumentsError,
} = require("../lib/constants");

const UserModel = require("../models/user");
const logger = require("../lib/logger");
const utils = require("../utils/utils");
const user = require("../models/user");

/**
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.findOne = async (req, res) => {
  logger.debug("Enter Users.findOne()");

  const { id, email, fullName } = req.query;
  let params = [];

  let clientId = res.locals.user.clientId;
  // restrict search to users of the same clientId.
  // If user is 'SuperAdmin', clientId may be wildcarded
  clientId = clientId === 0 ? "/.*" + clientId + ".*/" : clientId;

  if (id) params.push({ _id: id });
  if (clientId) params.push({ clientId: clientId });
  if (email) params.push({ email: /.*`${email}`.*/ });
  if (fullName) params.push({ fullName: /.*`${fullName}`.*/ });

  const query = { $or: params };
  logger.debug("Users.find(" + JSON.stringify(query) + ")");

  const user = await UserModel.findOne(query);

  return res.status(OK).json(user);
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.findAll = async (req, res) => {
  logger.debug("Enter Users.findAll()");
  req.query.all = "true";
  return find(req, res);
};

/**
 * Find multiple users by either of the following user properties:
 *  id, email, clientId, fullName
 *
 * Pagination:
 *  - Input argument requires number of rows('limit'), and row offset('offset').
 *  - Return 100 rows if limit is not specified in argument.
 *  - Return rows starting at offset 0 (first row) if offset is not specified in argument.
 *
 * @param req
 * @param res
 */
module.exports.find = async (req, res) => {
  logger.debug("Enter Users.find()");

  let params = [];
  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);

  /**
   * validate
   */

  const returnFields = req.query.fields ? req.query.fields.split(",") : [];
  const email = req.query.email;
  const fullName = req.query.fullName;
  const id = req.query.id;
  const all = req.query.all ? (req.query.all === "true" ? true : false) : false;

  /**
   * process parameters
   */

  // args email, fullname are always wildcarded.

  if (id) params.push({ _id: id });
  if (email) params.push({ email: new RegExp(email, "i") });
  if (fullName) params.push({ fullName: new RegExp(fullName, "i") });

  // Fail if query param missing either id, email, fullname.
  // Allow if all is set - from findAll

  if (!params.length && !all) {
    return res.status(OK).json(paramMissingError);
  }
  // restrict search to users of the same clientId.
  // If user is 'SuperAdmin' allow search across merchant (aka: client) data

  logger.debug("user: " + JSON.stringify(res.locals.user));
  let clientId = res.locals.user.clientId;
  clientId = clientId === 0 ? new RegExp(clientId, "i") : clientId;
  if (clientId) params.push({ client: clientId });

  // paginate if available, if not set defaults

  if (!offset) offset = 0;
  if (!limit) limit = 100;

  /**
   * create query
   */

  let users = [];
  const query = { $and: params };

  // specify db cols to return or omit

  let projection = {};
  const omitFields = { password: 0, __v: 0 };

  if (returnFields.length) {
    for (let field of returnFields) {
      projection[field] = 1;
    }
  } else {
    projection = omitFields;
  }

  try {
    // execute query
    users = await UserModel.find(query, projection).skip(offset).limit(limit);
  } catch (e) {
    logger.warn("Users.find() exception: " + JSON.stringify(e));
    return res.status(NOT_ACCEPTABLE).json(invalidArgumentError);
  }

  return res.status(OK).json(users);
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.create = async (req, res) => {
  // Check parameters
  const { user } = req.body;
  if (!user) {
    return res.status(BAD_REQUEST).json({
      error: paramMissingError,
    });
  }
  // Add new user
  await UserModel.create(user);
  return res.status(CREATED).end();
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.update = async (req, res) => {
  logger.debug("Enter User.update()");
  logger.debug("params: " + JSON.stringify(req.body));

  let params = {};

  /**
   * validate input fields
   */

  // email is unique id and should not be updated
  const { id, fullName, password, role, active } = req.body;

  if (!id) return res.status(BAD_REQUEST).send(missingIdError);
  if (!fullName && !password && !role && !active)
    return res.status(BAD_REQUEST).send(missingArgumentsError);

  // restrict search to users of the same clientId.
  // If user is 'SuperAdmin' allow search across merchant (aka: client) data

  let clientId = res.locals.user.clientId;
  if (!clientId) {
    logger.debug("users.update() - Error: missing ClientId.");
    return res.statu(METHOD_ERROR).send(invalidAuthError);
  }

  /**
   * create query
   */

  // find entry to update
  const query = { $and: [{ _id: id }, { client: clientId }] };

  try {
    const user = await UserModel.findOne(query);

    if (!user) return res.status(NOT_FOUND).send(noEntriesFound);

    // update fields

    if (password) user.setPassword(password);
    if (role) user.role = role;
    if (active) user.active = active;
    if (fullName) user.fullName = fullName;

    // save changes

    user.save();
  } catch (e) {
    logger.debug("user.update() - failed: " + e.message);
    return res.status(INTERNAL_SERVER_ERROR).send(serverError);
  }

  return res.status(OK).send(updateSuccess);
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
module.exports.remove = async (req, res) => {
  const { id } = req.params;
  await UserModel.delete(Number(id));
  return res.status(OK).end();
};
