'use strict';

const logs = require('..');
const assert = require('assert').strict;

assert.strictEqual(logs(), 'Hello from logs');
console.info("logs tests passed");
