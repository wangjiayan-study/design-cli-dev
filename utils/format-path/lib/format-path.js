'use strict';
const path = require('node:path')
module.exports = formatPath;

/**
 * path.sep在win下输出 "\",在mac下输出"/"
 * @param {*} p 
 * @returns 
 */
function formatPath (p) {
    const isWin = path.sep === '\\'
    if ( p && typeof p === 'string' && isWin ) {
        return p.replace(/\\/g,'/')
    }
    return p
}