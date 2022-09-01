#!/usr/bin/env node 
const utils= require('@design-cli-dev/utils')
const yargs = require('yargs/yargs')
// 得到参数
const { hideBin } = require('yargs/helpers')
const arg = hideBin(process.argv)

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
