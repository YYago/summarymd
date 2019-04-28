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
// you can add more property if you need(Different from defaults). but don't del the default propertys(you can change the value).
// Why not JSON? For the summarymd module, you can redefine anything and use JavaScript files to customize configuration files with greater freedom. 
// If you need more customization, consider using the summarymd module instead of the command line.

const confs ={
    // 
    // it's just a default string ,you can do more. the "%title%" will be replaced by true title. 
    template: "# %title%",
    // 要包含的文件描述。
    includes: ['./**/*.md', './**/*.markdown'],
    // 要排除的文件描述。
    excludes:['!./node_modules/**/*.*'],
    // 正式目录文件。
    // Official directory file path.
    summary: "./SUMMARY.md",
    confs_with_create: {
        /**
         * 在创建文件时是否跳过URL为空或者链接文本为空的列表。
         * Whether to skip lists with empty URLs or empty link text when creating files.
         */
        isSkipEmptyTitleOrEmptyPath:true,
        // 远程路径匹配规则。
        // Remote Path Matching Rules--This package does not handle any remote paths unless the matched rules fail to match.
        remoteURLregexp: /(\\w\\:\\/|(\\.\\\.\\/)|(\\:\\\\\\\\)|(\\w+\\:\\d+)|\\~\\/|(\\d.+\\.\\d).[\\/|\\:\\?]?)|((\\w\\.[\\w|\\d]).*\\/.+([\\/]|\\:\\d|\\.html|\\.php|\\.jsp|\\.asp|\\.py))/g,
        },
    confs_with_summary: {
        // 临时目录文件。
        // Temporary directory file path
        tempSummary: "./_summary.md",
        // 是否使用基础文件名作为链接文本。
        // Whether to use the base file name as link text.
        isUseBFasLinkText: false,
        // Markdown 列表标记符。
        // Markdown List Markup Symbol
        listSing: "*",
        // 是否对链接进行 URL 编码。
        // 
        isEncodeURI: false,
        indent: {
            // 是否进行缩进, 'false'的话，后续的缩进设置会被忽略，不会执行缩进。 
            // Whether to perform URL encoding for links in the directory list.
            isIndent: true,

            // 单次缩进的空格个数。 本模块的实际缩进量 = indentLength * times，照目前的配置，缩进2次就是缩进 8 个空格。
            // Number of spaces indented once. The actual indentation of this module = indentLength * times. According to the current configuration, indentation twice is to indent eight spaces.
            indentLength: 4, 
            
            /* 下面两个配置项控制自定义缩进规则，基本格式为：
             
              [{basis:/npm/g,times:1}]
            
             basis -缩进规则，类型：正则表达式
             times -缩进次数（注意：不是缩进量是缩进次数）
            
            上面例子表示： 匹配到 "npm" 就缩进一次。
            注意：你不能同时设置它们，只能选其中一种方式来进行生成临时目录文件。如果不需要自定义缩进规则的话将两者都设置为null。

            The following two configurations control custom indentation rules in the basic format:
            
                [{basis:/npm/g, times:1}]

            basis - indentation rule, type: regular expression
            times - Indentation times.
            
            The above example shows that the matching to "npm" is indented once.

            NOTE:You can't set them up at the same time. You can only choose one way to generate temporary directory files. Set both to null if you don't need to customize indentation rules.
            */
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
    console.log(`   help_zh-CH: https://gitee.com/class877/summarymd`)
    console.log(`   help_EN: https://github.com/YYago/summarymd`)
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
        let cfile = path.join(process.cwd(),'./summaryConfig.js')
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
        throw new Error("If throw error, please run 'summarymd init' then try it again！\n"+e)
    }
}