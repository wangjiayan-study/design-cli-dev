#!/usr/bin/env node 


const  importLocal  = require ('import-local');

console.log('__filename',__filename)
 if(importLocal(__filename)){
  console.log('Using local version of this package');
 }else{
  require("..")(process.argv.slice(2));
 }


