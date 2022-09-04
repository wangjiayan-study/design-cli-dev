const log = require('@design-cli-dev/logs')
const semver = require('semver')
const { LOWEST_CODE_VERSION, DEFAULT_CLI_HOME}  = require('./const')
const colors = require('colors/safe')
const  { getNpmLastVersion }= require('get-npm-info')
const dotenv = require('dotenv')
const path = require('node:path')

const userhome = require('userhome');


module.exports = prepare

let userHomePath = userhome()

async function prepare () {
try {
   checkNodeVersion()
   checkRoot()
   await checkUserHome()
   await checkPkgVersion()
   await checkDebugMode()
   await setCachePath()
} catch(err){
   log.info(err)
   }
}


function checkRoot () {
   const rootCheck = require('root-check');
   rootCheck();
}

async function checkUserHome () {
   const { pathExistsSync } = await import('path-exists');
   if (!userHomePath  || !pathExistsSync(userHomePath)){
      throw new Error(colors.red('当前登录用户主目录不存在！'))
   }else{
      return userHomePath
   }
}

const pkg = require('./package.json')
/**
 * 检查pkg的版本号提示更新
 */
async function checkPkgVersion (){
   const {name, version} = pkg
   const list = await getNpmLastVersion('@design-cli-dev/code',version)
   if (list?.length){
      log.warn(colors.yellow(`您当前的版本是${version}，请手动更新${name}到最新版本v${list[0]}`))
   }
}

 /**
  * 检查Node版本
  */
function checkNodeVersion () {
    // 获取当前的Node版本号
   const curVersion = process.version
   if (semver.lte(curVersion,LOWEST_CODE_VERSION)) {
      throw new Error(colors.red`请升级Node版本至v${LOWEST_CODE_VERSION}`)
   }
}

function checkDebugMode () {
   var argv = require('minimist')(process.argv.slice(2));
   if (argv.debug){
      log.level = 'verbose'
   }
}

async function setCachePath(){
   const { pathExistsSync } = await import('path-exists');
   const dotEnvPath = path.resolve(userHomePath, '.env')
   if (pathExistsSync(dotEnvPath)){
      dotenv.config(dotEnvPath)
   }
   createDefaultConfig()
}

// 缓存目录类似这样：/Users/wangjiayan/.design-cli-dev
function createDefaultConfig () {
   process.env.CLI_HOME_PATH = process.env.CLI_HOME ? path.join(userHomePath, process.env.CLI_HOME) : path.join(userHomePath, DEFAULT_CLI_HOME)
}