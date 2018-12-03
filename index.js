'use strict';

const fs = require('fs');
const nmc = require('node-modules-custom');

const path = require('path');
const vinlyRead = require('vinyl-read');
const osType = require('os').type();

class summary{
    constructor(){
        this.includeDocs = [];
        this.excludeDocs = [];
        this.remoterParhRegep = /a/g;
        this.rootDir = process.cwd();
    }
    vinyl_path(wanteds){
        let inEx = arguments[0]||[this.includeDocs,this.excludeDocs];
        let vinyleRes = vinlyRead.sync(inEx);
        let rs_path = [];
        let rs_path_relative = [];
        if(!(vinyleRes==null)){          
            for(let i in vinyleRes){
                let item = vinyleRes[i].path
                let item_relative = path.relative(this.rootDir,item);
                if(osType =="Windows_NT"){
                    item = item.replace(/\\/g,"/");
                    item_relative = item_relative.replace(/\\/g,"/");
                }
                rs_path.push(item)
                rs_path_relative.push(item_relative);
            }
        }
        return {
           resolve: rs_path,
           relative: rs_path_relative
        }
    }
    getAllDocs(){

    }
}

let a = new summary()
console.log(osType)
console.log(a.vinyl_path('./**/*.md').resolve)
console.log(a.vinyl_path('./**/*.md').relative)

module.exports = {
    summary
}