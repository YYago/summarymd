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
 * `--config` or `-conf` | 定义配置文件，（会在当前文件夹下创建" summaryConf.json "文件，如果觉得它多余请在 push 之前将其删除或者添加到 '.gitignore' 中），*建议添加到".gitignore"中而不是删除，以后可能还会用到。*`
 * `--update` or `-u`| 更新目录，（会在当前文件夹下创建" _summary.md "文件，如果觉得它多余请在 push 之前将其删除或者添加到 '.gitignore' 中）.
 * `--create` | 创建已经列入目录但还未被创建的文件(只是写了大纲，没写文件的文件)。*已经存在的文件以及远程文件都会被忽略，不会创建*。
 * `--watch` or `-w`| 监视项目文件夹下的所有文件（除了被排除的文件），每当文件有更改时，及时作出处理——相当于自动执行` --update ` 命令。
 */

const nmc = require('node-modules-custom');
const inquirer = require('inquirer');

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
        "includes": null,
        "excludes": null
    },
    "createFile":{
        "isUseFileBaseNameAsTitle": false,
        "contentsToAppend":"",
        "isMkdir": false,
        "headTeamplate":"# {%title%}",
        "Enable":"disable"
    },
    "globalReplace":{
        EnDisable: false,
        "findAs": "",
        "replaceAs": ""
    }
}`;
