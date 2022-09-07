'use strict';
const path = require('node:path')
const log = require('@design-cli-dev/logs')
const Package = require('@design-cli-dev/package')
module.exports = exec;

const PACKAGES_NAME= {
    // create: '@design-cli-dev/code',
    create: '@design-cli-dev/create',
    publish: '@design-cli-dev/publish'
}
const CACHE_DIR = 'dependencies';
async function exec () {
    try {
    const command = arguments[arguments.length-1]
    const commandName = command.name()
    const pkgName = PACKAGES_NAME[commandName]
    let homePath = process.env.CLI_HOME_PATH
    // 指定定制包的路径
    let targetPath = process.env.CLI_TARGET_PATH
    // 包的安装路径
    let storePath = ''
    const packageVersion = 'latest';
    let pkg
    if (!targetPath) {
        // 不指定的定制包路径话要读缓存的默认包，
        // 先得到包
        // 且更新到最新版本
        targetPath = path.resolve(homePath, CACHE_DIR) // 缓存路径
        storePath = path.resolve(homePath, CACHE_DIR, 'node_modules')
        const options = {
            targetPath,
            storePath,
            pkgName,
            packageVersion
        }
    pkg = new Package(options)
    log.verbose('pkgName',pkgName)
    log.verbose('targetPath',targetPath)
    log.verbose('storePath',storePath)
    // 判断包是否存在
    if (await pkg.exist()){
        log.info('本地缓存存在包',pkg.cacheFilePath)
        // 存在，更新
        await pkg.update()
    }else {
        log.info('本地缓存查找不到初始化包',`准备安装${pkgName}`)
        await pkg.install()
    }
    } else {
        // 指定了定制包的路径，就不需要管缓存。直接初始化
        pkg = new Package({
            targetPath,
            pkgName,
            packageVersion
        })
    }
    // 得到pkg包的入口文件,并调用
    const rootFile = await pkg.getRootFilePath()
    if (rootFile){
        require(rootFile)
    }else{
        log.error('找不到入口文件',`请检查包${pkgName}是否指定入口文件`)
    }
    console.log('rootFile',rootFile)
 

} catch(err){
    throw new Error(err)
}



}
