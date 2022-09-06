'use strict';
const log = require('@design-cli-dev/logs')
const path = require('node:path')
const { getNpmLastVersion } = require('get-npm-info')

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
        console.log('Package===')
        this._prepare()
    }
    get cacheFilePath() {
        ///Users/wangjiayan/.design-cli-dev/dependencies/node_modules/this.pkgName@this.packageVersion
        const version =  !this.packageVersion || this.packageVersion === LATEST_VERSION ? getNpmLastVersion()  : this.packageVersion 
        const packageName =  this.packageVersion.replace('/','_')
        return path.resolve(this.storePath,`${packageName}@${version}`)
    }
    getLastVersion () {
        return getNpmLastVersion()
    }
    _prepare () {
        console.log('我执行了',_prepare)
    }
    /**
     * 检查缓存目录是否存在
     * 判断包的缓存路径是否存在
     */
    async exist(){
        const { pathExistsSync } = await import('path-exists');
        if (this.storePath && pathExistsSync(this.storePath)) {
            return pathExistsSync(this.cacheFilePath)
        }else {
            return false
        }
    }
    update (){}
    install () {
        try {
            npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                pkgs: [
                    { name: this.pkgName, 
                      version: this.packageVersion},
                    ],
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    getRootFilePath (){
        
    }
}
module.exports = Package;