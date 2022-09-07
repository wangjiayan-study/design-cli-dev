'use strict';
const log = require('@design-cli-dev/logs')
const path = require('node:path')
const { getNpmLatestVersion } = require('get-npm-info')
const fse = require('fs-extra')
const formatPath = require('@design-cli-dev/format-path')
const npminstall = require('npminstall')

const LATEST_VERSION = 'latest'

class Package {
    constructor (options){
        if (Object.prototype.toString.call(options) !== '[object Object]') {
            throw new Error('参数错误','必须传入对象')
        }
        this.targetPath = options.targetPath
        this.storePath = options.storePath
        this.pkgName = options.pkgName
        this.packageVersion = options.packageVersion
        // package的缓存目录前缀
        this.cacheFilePathPrefix = this.pkgName.replace('/', '_');
    }
    get cacheFilePath() {
        ///Users/wangjiayan/.design-cli-dev/dependencies/node_modules/_@design-cli-dev_code@1.0.1@@design-cli-dev  
        return path.resolve(this.storePath,`_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.pkgName}`)
    }

    async _prepare () {
        const { pathExistsSync } = await import('path-exists');
        if (!this.packageVersion || this.packageVersion === LATEST_VERSION) {
            this.packageVersion = await getNpmLatestVersion(this.pkgName)
        }
        if (this.storePath &&  !pathExistsSync(this.storePath)){
            fse.mkdirpSync(this.storePath)
        }
    }
    /**
     * 检查缓存目录是否存在
     * 判断包的缓存路径是否存在
     */
    async exist(){
        await this._prepare()
        const { pathExistsSync } = await import('path-exists');
        if (this.storePath && pathExistsSync(this.storePath)) {
            log.verbose('查看缓存目录',this.cacheFilePath)
            return pathExistsSync(this.cacheFilePath)
        }else {
            return false
        }
    }
    async update (){
        const { pathExistsSync } = await import('path-exists');
        try {
        // 1、获取npm包的最新版本号
        await this._prepare()
        // 2、在缓存路径中查看是否存在
        if (pathExistsSync(this.storePath)) {
            log.info('本地npm包名称',`${this.pkgName}@${this.packageVersion}`)
        }else {
            // 3、不存在，就执行安装
            npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                pkgs: [{
                    name: this.pkgName,
                    version: this.packageVersion
                },],
            })
        } } catch (err) {
            Promise.reject(err)
        }
}

    async install () {
        try {
            await this._prepare()
            npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                pkgs: [{
                    name: this.pkgName,
                    version: this.packageVersion},
                    ],
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    async getRootFilePath (){
        const { packageDirectory } = await import('pkg-dir')
        // 如果是有this.storePath ，就读缓存中包的pkg-dir
        // 如果不是，就读传入路径的pkg-dir
        const dirPath = this.storePath  ? this.cacheFilePath : this.targetPath
        let rootDir= await packageDirectory({cwd:dirPath}) 
    
        if (rootDir){
            // 读取package.json
            const pkgFilePath = path.resolve(rootDir,'package.json')
            const pkgFile = require(pkgFilePath)
            formatPath(pkgFilePath)
            // 3. 寻找main/lib
            if (pkgFile && pkgFile.main){
                // 4.路径兼容
                const mainPath = path.resolve(dirPath,pkgFile.main)
                return formatPath(mainPath)
            }
        }
        return null

    }
}
module.exports = Package;