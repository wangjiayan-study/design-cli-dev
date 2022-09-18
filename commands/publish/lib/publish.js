"use strict";
const Command = require("@design-cli-dev/command");
const log = require("@design-cli-dev/logs");
const Git = require("@design-cli-dev/git");
const path = require("node:path");
const fileExists = require("file-exists");
const fse = require("fs-extra");
class Publish extends Command {
  init() {
    const { refreshServer, refreshToken } = this._argv.options || {};
    this.refreshServer = refreshServer;
    this.refreshToken = refreshToken;
  }
  async exec() {
    try {
      const starTime = new Date().getTime();
      // 1、项目发布前初始化检查
      await this.prepare();
      // 2、git flow自动化
      const git = new Git(this.projectInfo, {
        refreshServer: this.refreshServer,
        refreshToken: this.refreshToken,
      });
      await git.prepare();
      // 3、云构建和云发布
      const endTime = new Date().getTime();
      log.info("本次发布耗时", Math.floor((endTime - starTime) / 1000));
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === "verbose") {
        console.log(e);
      }
    }
  }
  async prepare() {
    // 1、确定当前项目是否是npm 项目：是否包含package.json文件
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const isPkg = await fileExists(pkgPath);
    if (!isPkg) {
      throw new Error("当前项目不是一个npm项目");
    }

    // 2、确定是否是name,version,build命令：确保云构建云发布阶段顺利进行
    const { name, version } = fse.readJSONSync(pkgPath);
    const { build } = scripts || {};
    if (!name || !version || !build) {
      throw new Error("项目的package.json缺少 scripts build字段");
    }
    this.projectInfo = {
      name,
      version,
      build,
      dir: process.cwd(),
    };
  }
}

module.exports = publish;
function publish(args) {
  return new Publish(args);
}
