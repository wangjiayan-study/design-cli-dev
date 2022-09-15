"use strict";

const Spinner = require("cli-spinner").Spinner;

module.exports = {
  spinnerStart,
  sleep,
  exec,
  execAsync,
  readFile,
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

function exec(command, commandArgs, options) {
  const win32 = process.platform === "win32";
  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : commandArgs;
  const { spawn } = require("child_process");
  return spawn(cmd, cmdArgs, options || {});
}

function execAsync(command, commandArgs, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, commandArgs, options);
    p.on("error", (e) => {
      reject(e);
    });
    p.on("exit", (c) => {
      resolve(c);
    });
  });
}

function readFile(path) {
  if (fs.existsSync(path)) {
    const buffer = fs.readFileSync(path);
    if (buffer) {
      if (buffer.toJSON()) {
        return buffer.toJSON();
      } else if (buffer.toString()) {
        return buffer.toString();
      }
    }
  }
  return null;
}
