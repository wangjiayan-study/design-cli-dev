"use strict";
const simpleGit = require("simple-git");
const fse = require("fs-extra");
const userhome = require("userhome");
const inquirer = require("inquirer");
const path = require("node:path");
const { readFile } = require("@design-cli-dev/utils");
const DEFAULT_CLI_HOME = ".design-cli-dev";
const GIT_SERVER_FILE = ".git_server";
// 在用户主目录下放一个.git文件夹里面存放git相关的变量
const GIT_ROOT_DIR = ".git";

class Git {
  constructor({ name, version, build }, { refreshServer }) {
    this.name = name;
    this.version = version;
    this.buildScript = build; // 构建脚本
    this.homePath = null;
    this.git = simpleGit();
    this.gitServer = null; // GitServer实例
    this.refreshServer = refreshServer;
    this.token = null;
    this.user = null; //用户信息
    this.orgs = null; // 用户所属组织列表
    this.owner = null; //远程仓库类型
    this.login = null; // 远程仓库登录名
  }
  async prepare() {
    //1、检查缓存主目录
    this.checkHomePath();
    // 2、检查gitServer:这里需要做缓存，因为不希望每次都进行询问。
    // 如果想要修改gitServer，可以通过命令行传入参数 --refreshServer
    this.checkGitServer();
    this.createGitServer();
  }

  checkHomePath() {
    if (!this.homePath) {
      if (process.env.CLI_HOME_PATH) {
        this.homePath = process.env.CLI_HOME_PATH;
      } else {
        const userHome = userhome();
        const homePath = path.resolve(userHome, DEFAULT_CLI_HOME);
        fse.ensureDir(homePath);
        this.homePath = homePath;
      }
    }
    if (!fs.existsSync(this.homePath)) {
      throw new Error("用户主目录获取失败！");
    }
  }
  async checkGitServer() {
    // 找到缓存目录下的gitServer，读取到它的值。
    // 有值就不用创建，没有值就走询问流程
    const gitServerPath = createPath(GIT_SERVER_FILE);
    if (this.gitServer || readFile(gitServerPath)) {
      return;
    }
  }

  createPath(path) {
    const rstPath = path.resolve(this.homePath, GIT_ROOT_DIR, GIT_ROOT_DIR);
    fse.ensureDir(rstPath);
    return rstPath;
  }
  async createGitServer() {
    // if (this.gitServer) {
    // }
  }
  async init() {
    // 生成远程仓库
    // 添加远程仓库
    // git init
    // 关联远程仓库
  }
  commit() {
    //1、生成开发分支
    this.getCurrentVersion();
    //2、在开发分支提交代码
    //3、合并远程开发分支
    //4、推送开发分支
  }
  getCurrentVersion() {}
}

module.exports = Git;
