'use strict';

const getnpminfo = require('..');
const assert = require('assert').strict;

assert.strictEqual(getnpminfo(), 'Hello from getnpminfo');
console.info("getnpminfo tests passed");
