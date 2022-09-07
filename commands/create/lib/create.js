'use strict';
const Command = require('@design-cli-dev/command')


class Create extends Command {
    super(args){
        console.log('args',args)
    }
    init () {
        console.log('init方法')
    }
    exec () {
        console.log('exec方法')
    }
}

function init (args) {
    return new Create(args)
}
module.exports = init