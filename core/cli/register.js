const { Command } = require('commander');
const pkg = require('./package.json')
const program = new Command();

module.exports = registerCommander

function registerCommander () {
    const cliName = Object.keys(pkg.bin)?.[0]
    const version = pkg.version
    program
    .usage('<command>')
    .name(cliName)
    .description('搭建海报模板的脚手架项目')
    .version(version)
    .option('-d, --debug','是否开启debug模式')

    program
    .command('create <appName>')
    .description('创建一个新项目')
    .option('-f, --force','是否强制创建项目')
    .showHelpAfterError()
    .action((msg)=>{
        console.log(msg)
    })

    program
    .command('publish')
    .description('将创建的项目推送到远程仓库')
    .showHelpAfterError()
    .action(()=>{
        console.log('publish')
    })
    //对debug参数进行监听
    program.on('option:debug',function(){
        process.env.LOG_LEVEL='verbose'
    })
  
    try{
        program.parse();
    }catch(err){
     console.log('我封装了',err)
    }


}