#!/usr/bin/env node

const smd = require('./index');
const fs = require('fs');
const path = require('path');
const gw = require('glob-watcher');
const lodash = require('lodash');
const sm = new smd()

function init(ReAndI){
    function w(){
        let confs =
`
const confs ={
    // you can add more property if you need(Different from defaults). but don't del the default propertys(you can change the value).
    // Why not JSON? For the summarymd module, you can redefine anything and use JavaScript files to customize configuration files with greater freedom. 
    // If you need more customization, consider using the summarymd module instead of the command line.

    template: "# %title%",// it's just a default string ,you can do more. the "%title%" will be replaced by true title. 
    includes: ['./**/*.md', './**/*.markdown'],
    excludes:['!./node_modules/**/*.*'],
    summary: "./SUMMARY.md",
    confs_with_create: {
        isUseFileBasenameAsTitle: false,
        remoteURLregexp: /(\\w\\:\\/|(\\.\\\.\\/)|(\\:\\\\\\\\)|(\\w+\\:\\d+)|\\~\\/|(\\d.+\\.\\d).[\\/|\\:\\?]?)|((\\w\\.[\\w|\\d]).*\\/.+([\\/]|\\:\\d|\\.html|\\.php|\\.jsp|\\.asp|\\.py))/g,
        },
    confs_with_summary: {
        tempSummary: "./_summary.md",
        isUseBFasLinkText: false,
        listSing: "*",
        isEncodeURI: false,
        indent: {
            isIndent: true,
            indentLength: 4,
            IndentByDirs: null,
            IndentByTitle: null,
        }
    }
}
module.exports = {
    confs
}
`
        fs.writeFileSync('summaryConfig.js',confs,{encoding:'utf8',flag:'w'})        
    }
    if(ReAndI=="init"&&fs.existsSync('./summaryConfig.js')==false){
        w()
    }else if(ReAndI=="reinit"){
        w()
    }
}

if(process.argv[2]=="help"||process.argv[2]=="-h"){
    console.log(`   help_zh-CH: \n  help_EN: `)
}

if(process.argv[2]=="init"||process.argv[2]=="-i"){
    init('init')
    return
}
if(process.argv[2]=="reinit"){
    init('reinit')
    return
}

if(process.argv[2]=="create"||process.argv[2]=="-c"||process.argv[2]=="update"||process.argv[2]=="-u"||process.argv[2]=="watch"||process.argv[2]=="-w"||process.argv[2]=="status"||process.argv[2]=="-s"){
    let cmd = process.argv[2];
    try{
        let cfile = path(process.cwd(),'./summaryConfig.js')
        const conf= require(cfile);
        sm.configs = conf.confs;
        if(cmd=="create"||cmd=="-c"){
            sm.create((t)=>{let template = "";template = sm.configs.template; return template.replace(/(\%title\%)/g,t)});
            return
        }
        if(cmd=="update"||cmd=="-u"){
            sm.update()
            return
        }
        if(cmd == "status"||cmd =="-s"){
            sm._summaryStatus_hasProblems()
        }
        if(cmd =="watch"||cmd =="-w"){
            let souc = lodash.flattenDeep([sm.configs.includes, sm.excludes]);
            let watcher=gw(souc)
            watcher.on('add',()=>{
                sm.update()
                sm._summaryStatus_hasProblems()
            })
            watcher.on('unlink',()=>{
                sm.update()
                sm._summaryStatus_hasProblems()
            })
            let summWatcher = gw(sm.configs.summary);
            summWatcher.on('change',()=>{
                sm.create((t)=>{let template = "";template = sm.configs.template; return template.replace(/(\%title\%)/g,t)});
                sm._summaryStatus_hasProblems()
            })
        }
    }catch(e){
        throw new Error("If throw error, please run 'summarymd init' then try it again！"+e)
    }
}




