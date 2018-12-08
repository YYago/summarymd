#!/usr/bin/env node

'use strict';

/**
 * @file command.js
 * @description
 * 
 * 也许我们需要一个配置文件来设置如何更新目录、如何批量创建文件、哪些文件是不用处理的，哪些是需要时刻监视。好处在于我们不必在每次处理时都去处理命令参数（搞砸了就麻烦了）。
 * 
 * 命令 | 描述
 * -----|-----
 * `help`   | helper。
 * `config` | 定义配置文件，（会在当前文件夹下创建" summaryConf.json "文件，如果觉得它多余请在 push 之前将其删除或者添加到 '.gitignore' 中），*建议添加到".gitignore"中而不是删除，以后可能还会用到。*`
 * `update` | 更新目录，（会在当前文件夹下创建" _summary.md "文件，如果觉得它多余请在 push 之前将其删除或者添加到 '.gitignore' 中）.
 * `create` | 创建已经列入目录但还未被创建的文件(只是写了大纲，没写文件的文件)。*已经存在的文件以及远程文件都会被忽略，不会创建*。
 * `watch`  | 监视项目文件夹下的所有文件（除了被排除的文件），每当文件有更改时，及时作出处理——相当于自动执行` --update ` 命令。
 */


const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const sdApi = require('./index');
const sdUpdate = require('./updateSummary');
const sdCreater = require('./createfile');

const summaryConfJSON =
    `{
    "update":{
        "isIndent": true, 
        "TabLength": 4, 
        "usFileBaseNameAsLinkText": false, 
        "liSign": "*", 
        "EncodeURI": false, 
        "indentByDir": false, 
        "out": "_summary.md",
        "excludes": null
    },
    "createFile":{
        "isUseFileBaseNameAsTitle": false,
        "contentsToAppend":"",
        "isMkdir": false,
        "headTeamplate":"default"
    },
    "globalReplace":{
        "Enable": false,
        "findAs": "",
        "replaceAs": ""
    },
    "watcher":true
}`;

let hasSummaryFile = fs.existsSync('./SUMMARY.md');
let hasConfigFile = fs.existsSync('./summarymd.json');

if(hasSummaryFile==false && process.argv[2]=="create"){
    throw console.error(`当前文件夹没有 SUMMARY.md 文件，无法取得文件信息供创建。`);
}

/** 创建 `'./summarymd.json'` 文件*/
function wrCFile() {
    if (hasConfigFile !== true) {
        fs.writeFileSync('./summarymd.json', summaryConfJSON, { encoding: 'utf8', flag: 'w' });
    }
}
/** 获取用户配置信息*/
function userConfig() {
    if (hasConfigFile) {
        let userConf = JSON.parse(fs.readFileSync('summarymd.json', { encoding: 'utf8' }));
        return {
            userExclude : userConf.update.excludes,
            userUpoptions : userConf.update,
            userCreatOptions : userConf.createFile,
            userGlobalReplace : userConf.globalReplace,
        }
    } else {
        return false
    }
}


let userConfigConfs = userConfig();
/** 返回全部文档文件*/
let allDoc;
/** 已经存在于 `SUMMARY.md` 的文档文件*/
let listedDoc;

if (userConfigConfs !== false) {
    let exif = userConfigConfs.userExclude[0] !== null && userConfigConfs.userExclude[0] !== "";
    if (exif) {
        allDoc = sdApi.summary.DocsFileList(userConfigConfs.userExclude);
    }
} else {
    allDoc = sdApi.summary.DocsFileList()
}

if(hasSummaryFile){
    listedDoc = sdApi.summary.havenListedDocs();
}else{
    listedDoc = [null];
}
/** 待创建文档文件*/
let notListedDocuments = lodash.difference(allDoc,listedDoc);

function cmd(){
    let userCCO = userConfigConfs.userCreatOptions;
    let COpt ={
        lists: listedDoc,
        contents: userCCO.contents,
        useFileBaseNameAsTitle: userCCO.useFileBaseNameAsTitle,
        headTeamplate: userCCO.headTeamplate,
    }
    sdCreater.createrByConfs(COpt);
};
function updateSum(){
    let userUSO = userConfigConfs.userUpoptions;
    let USO = {
        lists: notListedDocuments,
        isIndent: userUSO.isIndent,
        TabLength: userUSO.TabLength,
        usFileBaseNameAsLinkText: userUSO.usFileBaseNameAsLinkText,
        liSign: userUSO.liSign,
        EncodeURI: userUSO.EncodeURI,
        indentByDir: userUSO.indentByDir,
        out: userUSO.out,
    }
    sdUpdate.summaryUpdate(USO);
};
function undf(){
    console.log(
        `   
                summarymd commands
            -------------------------
            command: zz [option]
            -------------------------
            The options:
            ------------|
            help        helper.
            config      Create 'summarymdConf.json'.
            update      Create '_summary.md' and update the links.
            create      Create Docs that not exists from 'SUMMARY.md'. 
        `
        );
};
if(process.argv[2]=="config"){
    wrCFile();
}else if(process.argv[2]=="create"){
    cmd();
}else if(process.argv[2]=="update"){
    updateSum();
}else if(process.argv[2]=="help"){
    undf();
}else{
    undf();
}