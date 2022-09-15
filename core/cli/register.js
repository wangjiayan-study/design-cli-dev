const { Command } = require("commander");
const pkg = require("./package.json");
const program = new Command();
const log = require("@design-cli-dev/logs");
const colors = require("colors/safe");
const exec = require("@design-cli-dev/exec");
module.exports = registerCommander;

function registerCommander() {
  const cliName = Object.keys(pkg.bin)?.[0];
  const version = pkg.version;
  program
    .usage("<command>")
    .name(cliName)
    .description("搭建海报模板的脚手架项目")
    .version(version);

  program
    .command("create <appName>")
    .description("创建一个新项目")
    .option("-f, --force", "是否强制创建项目")
    .option("-tp, --targetPath <targetPath>", "指定自定义包的目录", "")
    .option("-d, --debug", "是否开启debug模式", false)
    .showHelpAfterError()
    .action(exec);
  program
    .command("publish")
    .description("将创建的项目推送到远程仓库")
    .showHelpAfterError()
    .option("-tp, --targetPath <targetPath>", "指定自定义包的目录", "")
    .option("-r,--refreshServer", "强制更新远程Git仓库")
    .option("--refreshToken", "强制更新远程仓库token")
    .option("--refreshOwner", "强制更新远程仓库类型")
    .option("-d, --debug", "是否开启debug模式", false)
    .action(exec);
  //对debug参数进行监听
  program.on("option:debug", function () {
    process.env.LOG_LEVEL = "verbose";
    log.verbose("当前是debug模式");
  });

  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = this.opts().targetPath;
  });
  program.parse(process.argv);

  // 对未知命令进行监听。
  // 注意，未知的命令才会走command:*
  // 如果是已经注册的命令不会走这里
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    log.error("未知的命令：", obj[0]);
    if (availableCommands.length > 0) {
      log.info("可用命令：", availableCommands.join(","));
    }
  });
  try {
    program.parse();
  } catch (err) {
    log.info(err);
  }
}
