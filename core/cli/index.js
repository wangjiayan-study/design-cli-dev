const log = require("@design-cli-dev/logs");

const prepare = require("./prepare");
const registerCommander = require("./register");

module.exports = core;

async function core() {
  try {
    await prepare();
    registerCommander();
  } catch (err) {
    log.info(err);
  }
}
