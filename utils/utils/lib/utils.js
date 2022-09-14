"use strict";

const Spinner = require("cli-spinner").Spinner;

module.exports = {
  spinnerStart,
  sleep,
};

function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

function spinnerStart(msg) {
  const spinner = new Spinner(msg + " %s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  return spinner;
}
