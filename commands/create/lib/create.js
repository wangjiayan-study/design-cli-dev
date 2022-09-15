"use strict";
const Command = require("@design-cli-dev/command");
const fs = require("node:fs");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const log = require("@design-cli-dev/logs");
const semver = require("semver");
const getProjectTemplate = require("./getProjectTemplate");
const Package = require("@design-cli-dev/package");
const userhome = require("userhome");
const glob = require("glob");
const { spinnerStart, sleep, execAsync } = require("@design-cli-dev/utils");
const ejs = require("ejs");
const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";
const DEFAULT_CLI_HOME = ".design-cli-dev";
const userHome = userhome();

class Create extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._argv.options.force;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async exec() {
    try {
      // 1. 准备阶段
      await this.prepare();
      // 2. 下载模板
      await this.downloadTemplate();
      // 3. 安装模板：把模板复制到执行目录，并执行安装和启动
      await this.installTemplate();
    } catch (err) {
      throw new Error(err);
    }
  }
  /**
   * 准备阶段
   */
  async prepare() {
    // 0. 判断项目模板是否存在
    const { data: template } = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error("项目模板不存在");
    }
    // 1. 判断当前目录是否为空
    this.template = template;
    if (this.isCwdEmpty()) {
      // 1.1 询问是否继续创建
      const { isContinue } = await inquirer.prompt([
        {
          type: "confirm",
          message: "当前目录不为空,是否清空当前目录继续创建？",
          name: "isContinue",
        },
      ]);
      if (isContinue) {
        await fse.emptyDir(process.cwd());
      }
    }
    // 3. 选择创建项目或组件
    return this.getProjectInfo();
  }
  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    );

    const targetPath = path.resolve(userHome, DEFAULT_CLI_HOME, "template");
    const storeDir = path.resolve(
      userHome,
      DEFAULT_CLI_HOME,
      "template",
      "node_modules"
    );
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    this.templateNpm = new Package({
      targetPath,
      storePath: storeDir,
      pkgName: npmName,
      packageVersion: version,
    });
    if (!(await this.templateNpm.exist())) {
      const spinner = spinnerStart("正在下载模板...");
      await sleep();
      try {
        await this.templateNpm.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await this.templateNpm.exist()) {
          log.success("下载模板成功");
        }
      }
    } else {
      const spinner = spinnerStart("正在更新模板...");
      try {
        await this.templateNpm.update();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await this.templateNpm.exist()) {
          log.success("更新模板成功");
        }
      }
    }
  }
  async getProjectInfo() {
    this.projectInfo = {};
    // 1. 选择创建项目或组件
    const type = await this._getProjectType();
    this.template = this.template.filter((template) =>
      template.tag.includes(type)
    );
    this.projectPrompt = [];
    this._validProjectName(type);
    const title = type === TYPE_PROJECT ? "项目" : "组件";
    this.projectPrompt.push(
      {
        type: "input",
        name: "projectVersion",
        message: `请输入${title}版本号`,
        default: "1.0.0",
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!!!semver.valid(v)) {
              done("请输入合法的版本号");
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function (v) {
          if (!!semver.valid(v)) {
            return semver.valid(v);
          } else {
            return v;
          }
        },
      },
      {
        type: "list",
        name: "projectTemplate",
        message: `请选择${title}模板`,
        choices: this._createTemplateChoice(),
      }
    );
    if (type === TYPE_PROJECT) {
      // 2. 获取项目的基本信息
      const project = await inquirer.prompt(this.projectPrompt);
      this.projectInfo = {
        ...this.projectInfo,
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
      const descriptionPrompt = {
        type: "input",
        name: "componentDescription",
        message: "请输入组件描述信息",
        default: "",
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!v) {
              done("请输入组件描述信息");
              return;
            }
            done(null, true);
          }, 0);
        },
      };
      this.projectPrompt.push(descriptionPrompt);
      // 2. 获取组件的基本信息
      const component = await inquirer.prompt(this.projectPrompt);
      this.projectInfo = {
        ...this.projectInfo,
        type,
        ...component,
      };
    }
    // 生成classname
    if (this.projectInfo.projectName) {
      this.projectInfo.name = this.projectInfo.projectName;
      this.projectInfo.className = require("kebab-case")(
        this.projectInfo.projectName
      ).replace(/^-/, "");
    }
    if (this.projectInfo.projectVersion) {
      this.projectInfo.version = this.projectInfo.projectVersion;
    }
    if (this.projectInfo.componentDescription) {
      this.projectInfo.description = this.projectInfo.componentDescription;
    }
    return this.projectInfo;
  }
  async installTemplate() {
    const { type: tplType } = this.templateInfo;
    // 区分是否自定义模板
    if (tplType === "normal") {
      await this.installDefaultTpl();
    } else {
      await this.installCustomTpl();
    }
  }
  async installDefaultTpl() {
    // 1、复制模板到本地路径
    console.log("cacheFilePath", this.templateNpm.cacheFilePath);
    const sourcePath = path.resolve(this.templateNpm.cacheFilePath, "template");
    await fse.copy(sourcePath, process.cwd());
    log.verbose("模板已经复制到当前目录");
    // 2、ejs渲染
    await this.ejsRender({
      ignore: ["**/node_modules/**", "**/public/**"],
    });
    // 3、安装依赖
    const { installCommand, startCommand } = this.templateInfo;
    await this.execInstall(installCommand);
    // 4、启动项目
    await this.execStart(startCommand);
  }
  async ejsRender(options) {
    const dir = process.cwd();
    const projectInfo = this.projectInfo;
    return new Promise((resolve, reject) => {
      glob(
        "**",
        {
          cwd: dir,
          ignore: options.ignore || "",
          nodir: true,
        },
        function (err, files) {
          if (err) {
            reject(err);
          }
          return Promise.all(
            files.map((file) => {
              return new Promise((resolve1, reject1) => {
                const filePath = path.resolve(dir, file);

                ejs.renderFile(filePath, projectInfo, (err, data) => {
                  if (err) {
                    console.log("err", err);
                    reject1(err);
                  }
                  fse.writeFileSync(filePath, data);
                  resolve1(data);
                });
              });
            })
          )
            .then(() => {
              resolve();
            })
            .catch(() => {
              reject();
            });
        }
      );
    });
  }
  async execStart(startCommand) {
    if (startCommand) {
      log.info("执行启动命令", startCommand);
      await sleep();
      await this.execCommand(startCommand, "启动命令执行失败")
        .catch((err) => {
          throw new Error(err);
        })
        .finally(() => {
          log.success("安装安装成功");
        });
    } else {
      throw new Error("该安装没有配置安装命令");
    }
  }
  async execInstall(installCommand) {
    if (installCommand) {
      log.info("执行启动命令", installCommand);
      const spinner = spinnerStart("执行安装命令...");
      await sleep();
      await this.execCommand(installCommand, "安装命令执行失败")
        .catch((err) => {
          throw new Error(err);
        })
        .finally(() => {
          spinner.stop();
          log.success("模板安装成功");
        });
    } else {
      throw new Error("该模板没有配置安装命令");
    }
  }
  /**
   * 例如npm install,npm是command,install是参数
   * @param {*} command
   */
  async execCommand(command, errMsg) {
    if (command) {
      const cmdArray = command.split(" ");
      const cmd = cmdArray[0];
      if (!cmd) {
        throw new Error("命令不存在！命令：" + command);
      }
      const args = cmdArray.slice(1);
      log.verbose("cmd", cmd, args);
      const ret = await execAsync(cmd, args, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      if (ret !== 0) {
        throw new Error(errMsg);
      }
    }
  }
  async _getProjectType() {
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: TYPE_PROJECT,
      choices: [
        {
          name: "项目",
          value: TYPE_PROJECT,
        },
        {
          name: "组件",
          value: TYPE_COMPONENT,
        },
      ],
    });
    log.verbose("type", type);
    return type;
  }
  _createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }));
  }
  _validProjectName(type) {
    function isValidName(v) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
        v
      );
    }
    const title = type === TYPE_PROJECT ? "项目" : "组件";
    const projectNamePrompt = {
      type: "input",
      name: "projectName",
      message: `请输入${title}名称`,
      default: "",
      validate: function (v) {
        const done = this.async();
        setTimeout(function () {
          // 1.首字符必须为英文字符
          // 2.尾字符必须为英文或数字，不能为字符
          // 3.字符仅允许"-_"
          if (!isValidName(v)) {
            done(`请输入合法的${title}名称`);
            return;
          }
          done(null, true);
        }, 0);
      },
      filter: function (v) {
        return v;
      },
    };
    let isProjectNameValid = false;
    if (isValidName(this.projectName)) {
      isProjectNameValid = true;
      this.projectInfo.projectName = this.projectName;
    }
    if (!isProjectNameValid) {
      this.projectPrompt.push(projectNamePrompt);
    }
  }
  isCwdEmpty() {
    const localPath = process.cwd();
    const fileList = fs.readdirSync(localPath);
    return !!fileList?.length;
  }
}

function init(cmdOptions) {
  console.log("cmdOptions", cmdOptions);
  return new Create(cmdOptions);
}
module.exports = init;
