const { set } = require("../app");

const nonBlockingWait = () => {
  return new Promise((resolve) => {
    setImmediate(() => resolve());
  });
}

const util = {
  nonBlockingWait: nonBlockingWait
}

module.exports = util
