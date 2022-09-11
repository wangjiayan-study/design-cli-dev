'use strict';
const Command = require('@design-cli-dev/command')
const fs = require('node:fs')
const inquirer = require('inquirer');
const fse = require('fs-extra')
const log = require('@design-cli-dev/logs')
const semver = require('semver')

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
class Create extends Command {
    constructor (args){
        super(args)
    }
    init () {
        console.log('init方法')
    }
    async exec () {
        try{

     
        await this.prepare()
    } catch(err){
        throw new Error(err)
    }
    }
    /**
     * 准备阶段
     */
    async prepare(){
    // 1. 判断当前目录是否为空
    if (this.isCwdEmpty()) {
        // 1.1 询问是否继续创建
        const {isContinue} = await inquirer.prompt([{
            type:'confirm',
            message:'当前目录不为空,是否清空当前目录继续创建？',
            name:'isContinue'
        }])
        if (isContinue){
            fse.emptyDir(process.cwd())
        }
    }
    // 3. 选择创建项目或组件
    this.getProjectInfo()

    // 4. 获取项目的基本信息
    }
    async getProjectInfo (){
          // 1. 选择创建项目或组件
          const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT
            }, {
                name: '组件',
                value: TYPE_COMPONENT
            }]
        })
        log.verbose('type', type)
        if (type === TYPE_PROJECT) {
            const o = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (v) {
                    const done = this.async();

                    setTimeout(function () {
                        // 1. 输入的首字符必须为英文字母
                        // 2. 尾字符必须为英文或数字，不能为字符
                        // 3. 字符允许"-_"
                        // 合法: a, a-b, a_b, a-b-c, a-b1-c1,a_b1_c1a1,a1,a1-b1-c1, a1_b1_c1
                        // 不合法: 1,a_,a-.a_1,a-1
                        const reg = /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/
                        if (!reg.test(v)) {
                            done('请输入合法的项目名称');
                            return;
                        }
                        done(null, true);
                    }, 0);
                },
                filter: function (v) {
                    return v
                }
            }, {
                type: 'input',
                name: 'projectVersion',
                message: '请输入项目版本号',
                default: '1.0.0',
                validate: function (v) {
                    const done = this.async();
                    setTimeout(function () {
                        if (!(!!semver.valid(v))) {
                            done('请输入合法的版本号');
                            return;
                        }
                        done(null, true);
                    }, 0);
                },
                filter: function (v) {
                    if (semver.valid(v)) {
                        return semver.valid(v)
                    } else {
                        return v
                    }
                }
            }])
    
        }
    }
    isCwdEmpty(){
      const localPath = process.cwd()
      const fileList = fs.readdirSync(localPath)
      return !!fileList?.length 
    }
    downloadTemplate (){

    }
}

function init (args) {
    return new Create(args)
}
module.exports = init