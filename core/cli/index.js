const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const log = require('@design-cli-dev/logs')


module.exports = core
 function core () {
    const version = checkPkgVersion()
    log.success('试试','123')
    console.log('exec core',version)
    const arg = hideBin(process.argv)
    // 得到参数
    yargs(arg).
    usage('Usage: $0 <command> [options]')
    .demandCommand(1, "A command is required. Pass --help to see all available commands and options.")
    .command('init','初始化',function (yargs) {
        return yargs.option('u', {
        alias: 'url',
        describe: 'the URL to make an HTTP request to'
        })
    },function (argv) {
        console.log(argv.url)
    }
    )
    .argv

 }
const pkg = require('./package.json')
 function checkPkgVersion (){
    return pkg.version
 }