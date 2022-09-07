'use strict';
const semver = require('semver')
const LOWEST_CODE_VERSION = '12.0.0'

class Command {
    constructor (argv) {
        if (!argv){
            throw new Error('参数不能为空！');
        }
        // if (!Array.isArray(argv)) {
        //     throw new Error('参数必须为数组！');
        // }
        if (argv.length < 1) {
            throw new Error('参数列表为空！');
          }
        const runner = new Promise ((resolve,reject) => {
            let chain = Promise.resolve()
            chain = chain.then(()=>this.checkNodeVersion())
            chain = chain.then(()=>this.initArgs())
            chain = chain.then(()=>this.init())
            chain = chain.then(()=>this.exec())
            chain.then(()=>resolve())
            chain.catch(err=>{
                log.error(err.message);
                reject(err)
            })
        })
    }
 /**
  * 检查Node版本
  */
  checkNodeVersion () {
    // 获取当前的Node版本号
   const curVersion = process.version
   if (semver.lte(curVersion,LOWEST_CODE_VERSION)) {
      throw new Error(colors.red`请升级Node版本至v${LOWEST_CODE_VERSION}`)
   }
}
    initArgs (){

    }
    init(){
        throw new Error('init方法必须实现')
    }
    exec (){
        throw new Error('init方法必须exec实现')
    }

}
module.exports = Command;
