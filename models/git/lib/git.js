"use strict";
const simpleGit = require("simple-git");
const fse = require("fs-extra");
const userhome = require("userhome");
const log = require("@design-cli-dev/logs");
const inquirer = require("inquirer");
const fs = require("node:fs");
const path = require("node:path");
const { readFile, writeFile, spinnerStart } = require("@design-cli-dev/utils");
const terminalLink = require("terminal-link");
const Gitee = require("./Gitee");
const Github = require("./Github");

const DEFAULT_CLI_HOME = ".design-cli-dev";
const GIT_SERVER_FILE = ".git_server";
// 在用户主目录下放一个.git文件夹里面存放git相关的变量
const GIT_ROOT_DIR = ".git";
const GIT_TOKEN_FILE = ".git_token";
const GIT_IGNORE_FILE = ".gitignore";
const GITHUB = "github";
const GITEE = "gitee";
const GIT_OWN_FILE = ".git_own";
const GIT_LOGIN_FILE = ".git_login";
const REPO_OWNER_USER = "user";
const REPO_OWNER_ORG = "org";
const VERSION_RELEASE = "release";
const VERSION_DEVELOP = "dev";
const GIT_SERVER_TYPE = [
  {
    name: "Github",
    value: GITHUB,
  },
  {
    name: "Gitee",
    value: GITEE,
  },
];

const GIT_OWNER_TYPE = [
  {
    name: "个人",
    value: REPO_OWNER_USER,
  },
  {
    name: "组织",
    value: REPO_OWNER_ORG,
  },
];

const GIT_OWNER_TYPE_ONLY = [
  {
    name: "个人",
    value: REPO_OWNER_USER,
  },
];
class Git {
  constructor(
    { name, version, dir = process.cwd() },
    { refreshServer, refreshToken }
  ) {
    this.projectName = name;
    this.version = version;
    this.dir = dir;
    this.homePath = null;
    this.git = simpleGit(dir);
    this.gitServer = null; // GitServer实例
    this.refreshServer = refreshServer;
    this.refreshToken = refreshToken;
    this.token = null;
    this.user = null; //用户信息
    this.orgs = null; // 用户所属组织列表
    this.owner = null; //远程仓库类型
    this.login = null; // 远程仓库登录名
    this.remotes = null; // 远程仓库origin,是个数组
    this.branch = null;
  }
  async prepare() {
    //1、检查缓存主目录
    this.checkHomePath();
    // 2、检查gitServer:这里需要做缓存，因为不希望每次都进行询问。
    // 如果想要修改gitServer，可以通过命令行传入参数 --refreshServer
    await this.checkGitServer();
    // 3、获取远程仓库Token:思路和检查gitServer一样。
    await this.checkGitToken();
    // 4、检查用户信息和组织
    await this.getUserAndOrgs();
    // 5、确认远程仓库类型
    await this.checkRepoType();
    // 6、检查并创建远程仓库
    await this.checkRepo();
    // 7 检查并创建.gitignore文件
    this.checkGitIgnore();
    // 8、完成本地仓库初始化
    await this.init();
  }
  async init() {
    try {
      // 1、生成远程仓库
      // 添加远程仓库
      // git init
      await this.gitInit();
      await this.initCommit();
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === "verbose") {
        console.log(e);
      }
    }
  }
  async commit() {
    // 1.生成开发分支
    await this.getCorrectVersion();
    // 2.检查stash区
    await this.checkStash();
    // 3.检查代码冲突
    await this.checkConflicted();
    // 4.切换开发分支
    await this.checkoutBranch(this.branch);
    // 5.合并远程master分支和开发分支代码
    await this.pullRemoteMasterAndBranch();
    // 6.将开发分支推送到远程仓库
    await this.pushRemoteRepo(this.branch);
  }
  async pullRemoteMasterAndBranch() {
    log.info(`合并 [master] -> [${this.branch}]`);
    await this.pullRemoteRepo("master");
    log.success("合并远程 [master] 分支代码成功");
    await this.checkConflicted();
    log.info("检查远程开发分支");
    const remoteBranchList = await this.getRemoteBranchList();
    if (remoteBranchList.indexOf(this.version) >= 0) {
      log.info(`合并 [${this.branch}] -> [${this.branch}]`);
      await this.pullRemoteRepo(this.branch);
      log.success(`合并远程 [${this.branch}] 分支代码成功`);
      await this.checkConflicted();
    } else {
      log.success(`不存在远程分支 [${this.branch}]`);
    }
  }
  async checkoutBranch(branch) {
    const localBranchList = await this.git.branchLocal();
    if (localBranchList.all.indexOf(branch) >= 0) {
      await this.git.checkout(branch);
    } else {
      await this.git.checkoutLocalBranch(branch);
    }
    log.success(`分支切换到${branch}`);
  }
  async checkStash() {
    log.info("检查stash记录");
    const stashList = await this.git.stashList();
    if (stashList.all.length > 0) {
      await this.git.stash(["pop"]);
      log.success("stash pop成功");
    }
  }
  async pullRemoteRepo(branchName, options) {
    log.info(`同步远程${branchName}分支代码`);
    await this.git.pull("origin", branchName, options).catch((err) => {
      log.error(err.message);
    });
  }
  async gitInit() {
    const gitPath = path.resolve(this.dir, GIT_ROOT_DIR);
    if (!fs.existsSync(gitPath)) {
      // 有.git 文件 说明已经初始化过了，不用继续下面流程
      log.info("执行git初始化");
      await this.git.init();
    }
    this.remote = this.gitServer.getRemote(this.login, this.projectName);
    // 先查看有没有远程origins
    const remotes = await this.git.getRemotes();
    log.verbose("git remotes", remotes);
    if (!remotes.find((item) => item.name === "origin")) {
      await this.git.addRemote("origin", this.remote);
      log.notice("git初始化成功", this.remote);
      await this.git.branch("-M master");
      await this.git.push("origin", "master", { "--set-upstream": "true" });
    }
  }
  async initCommit() {
    await this.checkConflicted();
    // 检查没有冲突，会把没有提交的提交上去
    await this.checkNotCommitted();
    if (await this.checkRemoteMaster()) {
      // 有远程master话先拉远程的先拉下来
      await this.pullRemoteRepo("master", {
        "--allow-unrelated-histories": null,
      });
    } else {
      // 没有远程分支就先创建本地分支，并且提交到master
      await this.pushRemoteRepo("master");
    }
  }
  async pushRemoteRepo(branchName) {
    log.info(`推送代码至${branchName}分支`);
    await this.git.push("origin", branchName);
    log.success("推送代码成功");
  }
  async checkRemoteMaster() {
    return (
      (await this.git.listRemote(["--refs"])).indexOf("refs/heads/master") >= 0
    );
  }
  async checkConflicted() {
    log.info("代码冲突检查");
    const status = await this.git.status();
    if (status.conflicted.length > 0) {
      throw new Error("当前代码存在冲突，请手动处理合并后再试！");
    }
    log.success("代码冲突检查通过");
  }
  async checkNotCommitted() {
    const status = await this.git.status();
    if (
      status.not_added.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.modified.length > 0 ||
      status.renamed.length > 0
    ) {
      log.verbose("status", status);
      await this.git.add(status.not_added);
      await this.git.add(status.created);
      await this.git.add(status.deleted);
      await this.git.add(status.modified);
      await this.git.add(status.renamed);
      let message;
      while (!message) {
        message = (
          await inquirer.prompt({
            type: "text",
            name: "message",
            message: "请输入commit信息：",
          })
        ).message;
      }
      await this.git.commit(message);
      log.success("本次commit提交成功");
    }
  }
  async checkRepo() {
    let repo = await this.gitServer.getRepo(this.login, this.projectName);
    if (!repo) {
      let spinner = spinnerStart("开始创建远程仓库...");
      try {
        if (this.owner === REPO_OWNER_USER) {
          repo = await this.gitServer.createRepo(this.projectName);
        } else {
          this.gitServer.createOrgRepo(this.projectName, this.login);
        }
      } catch (e) {
        log.error(e);
      } finally {
        spinner.stop(true);
      }
      if (repo) {
        log.success("远程仓库创建成功");
      } else {
        throw new Error("远程仓库创建失败");
      }
    } else {
      log.success("远程仓库信息获取成功");
    }
    this.repo = repo;
  }
  async checkRepoType() {
    const ownerPath = this.createPath(GIT_OWN_FILE);
    const loginPath = this.createPath(GIT_LOGIN_FILE);
    let owner = readFile(ownerPath);
    let login = readFile(loginPath);
    if (!owner || !login || this.refreshOwner) {
      owner = (
        await inquirer.prompt({
          type: "list",
          name: "owner",
          message: "请选择远程仓库类型",
          default: REPO_OWNER_USER,
          choices: this.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
        })
      ).owner;
      if (owner === REPO_OWNER_USER) {
        login = this.user.login;
      } else {
        login = (
          await inquirer.prompt({
            type: "list",
            name: "login",
            message: "请选择",
            choices: this.orgs.map((item) => ({
              name: item.login,
              value: item.login,
            })),
          })
        ).login;
      }
      writeFile(ownerPath, owner);
      writeFile(loginPath, login);
      log.success("owner写入成功", `${owner} -> ${ownerPath}`);
      log.success("login写入成功", `${login} -> ${loginPath}`);
    } else {
      log.success("owner获取成功", owner);
      log.success("login获取成功", login);
    }
    this.owner = owner;
    this.login = login;
  }
  async getUserAndOrgs() {
    this.user = await this.gitServer.getUser();
    if (!this.user) {
      throw new Error("用户信息获取失败！");
    }
    this.orgs = await this.gitServer.getOrg();
    if (!this.orgs) {
      throw new Error("组织信息获取失败！");
    }
    log.success(this.gitServer.type + " 用户和组织信息获取成功");
  }
  async checkGitToken() {
    const tokenPath = this.createPath(GIT_TOKEN_FILE);
    let token = readFile(tokenPath);
    if (!token || this.refreshToken || this.refreshToken) {
      log.warn(
        this.gitServer.type + " token未生成",
        "请先生成" +
          this.gitServer.type +
          " token，" +
          terminalLink("链接", this.gitServer.getTokenUrl())
      );
      token = (
        await inquirer.prompt({
          type: "password",
          name: "token",
          message: "请将token复制到这里",
          default: "",
        })
      ).token;
      writeFile(tokenPath, token);
      log.success("token写入成功", `${token} -> ${tokenPath}`);
    } else {
      log.success("token获取成功", tokenPath);
    }
    this.token = token;
    this.gitServer.setToken(token);
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
    log.verbose("用户主目录", this.homePath);
  }
  async checkGitServer() {
    // 找到缓存目录下的gitServer，读取到它的值。
    // 有值就不用创建，没有值就走询问流程
    const gitServerPath = this.createPath(GIT_SERVER_FILE);
    let gitServer = readFile(gitServerPath);
    if (!this.refreshServer && (this.gitServer || gitServer)) {
      log.success("git server获取成功");
    } else {
      gitServer = (
        await inquirer.prompt({
          type: "list",
          name: "gitServer",
          message: "请选择您想要托管的Git平台",
          default: GITHUB,
          choices: GIT_SERVER_TYPE,
        })
      ).gitServer;
      log.success("git server写入成功", `${gitServer} -> ${gitServerPath}`);
    }
    // 创建gitServer服务
    this.gitServer = this.createGitServer(gitServer);
    if (!this.gitServer) {
      throw new Error("GitServer初始化失败！");
    }
  }

  createPath(file) {
    const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR);
    const filePath = path.resolve(rootDir, file);
    fse.ensureDirSync(rootDir);
    return filePath;
  }
  createGitServer(gitServer) {
    if (gitServer === GITHUB) {
      return new Github();
    } else if (gitServer === GITEE) {
      return new Gitee();
    }
    return null;
  }

  async getCorrectVersion() {
    // 1、获取远程分支的版本号
    const remoteBranchList = this.getRemoteBranchList();
    let releaseVersion = null;
    if (remoteBranchList && remoteBranchList.length > 0) {
      releaseVersion = remoteBranchList[0];
    }
    log.verbose("线上最新版本号", releaseVersion);
    // 2、生成本地开发分支
    if (!releaseVersion || semver.gt(this.version, releaseVersion)) {
      this.branch = `${VERSION_DEVELOP}/${this.version}`;
      log.verbose("当前开发分支", this.branch);
    } else {
      log.info("当前线上版本大于本地版本", `${releaseVersion} > ${devVersion}`);
      const incType = (
        await inquirer.prompt({
          type: "list",
          name: "incType",
          message: "自动升级版本，请选择升级版本类型",
          default: "patch",
          choices: [
            {
              name: `小版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                "patch"
              )}）`,
              value: "patch",
            },
            {
              name: `中版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                "minor"
              )}）`,
              value: "minor",
            },
            {
              name: `大版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                "major"
              )}）`,
              value: "major",
            },
          ],
        })
      ).incType;
      const incVersion = semver.inc(releaseVersion, incType);
      this.branch = `${VERSION_DEVELOP}/${incVersion}`;
      this.version = incVersion;
    }
  }
  async getRemoteBranchList(type) {
    const remoteList = await this.git.listRemote(["--refs"]);
    let reg;
    if (type === VERSION_RELEASE) {
      reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g;
    } else {
      reg = /.+?refs\/heads\/dev\/(\d+\.\d+\.\d+)/g;
    }
    return remoteList
      .split("\n")
      .map((remote) => {
        const match = reg.exec(remote);
        reg.lastIndex = 0;
        if (match && semver.valid(match[1])) {
          return match[1];
        }
      })
      .filter((_) => _)
      .sort((a, b) => {
        if (semver.lte(b, a)) {
          if (a === b) return 0;
          return -1;
        }
        return 1;
      });
  }
  checkGitIgnore() {
    const gitIgnore = path.resolve(this.dir, GIT_IGNORE_FILE);
    if (!fs.existsSync(gitIgnore)) {
      writeFile(
        gitIgnore,
        `.DS_Store
node_modules
/dist


# local env files
.env.local
.env.*.local

# Log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`
      );
      log.success(`自动写入${GIT_IGNORE_FILE}文件成功`);
    }
  }
}

module.exports = Git;
