const log = require('@design-cli-dev/logs')
const semver = require('semver')
const { LOWEST_CODE_VERSION }  = require('./const')
const colors = require('colors/safe')
const  { getNpmLastVersion }= require('get-npm-info')

const userhome = require('userhome');


module.exports = core

let userHomePath = userhome()
async function core () {
try {
   checkNodeVersion()
   checkRoot()
   await checkUserHome()
   checkPkgVersion()
   await checkPkgVersion()
   await checkDebugMode()
} catch(err){
   log.info(err)
   }
}


function checkRoot () {
   const rootCheck = require('root-check');
  rootCheck();
}

async function checkUserHome () {
   const {pathExistsSync} = await import('path-exists');
   console.log('UserHomePath',userHomePath,pathExistsSync(userHomePath))
   if (!userHomePath  || !pathExistsSync(userHomePath))
   throw new Error(colors.red('当前登录用户主目录不存在！'))
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