'use strict';
const log  = require('npmlog')


log.addLevel('success', 2000, { fg: 'green', bold: true })
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
// 增加了前缀
log.heading = 'design-cli'


module.exports = log;