"use strict";
const fs = require("node:fs");
const Spinner = require("cli-spinner").Spinner;

module.exports = {
  spinnerStart,
  sleep,
  exec,
  execAsync,
  readFile,
  writeFile,
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

function writeFile(filePath, data, { rewrite = true } = {}) {
  if (fs.existsSync(filePath) && !rewrite) {
    return false;
  } else {
    fs.writeFileSync(filePath, data);
    return true;
  }
}
function readFile(filePath) {
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath, {
      flags: true,
      encoding: "UTF-8",
    });
    if (buffer) {
      if (buffer.toJSON) {
        return buffer.toJSON();
      } else if (buffer.toString) {
        return buffer.toString();
      }
    }
  }
  return null;
}
