'use strict';

/**
 * @file createfile.js
 * @description
 * 
 * 将 `SUMMARY.md` 中列出的文件批量创建到当前项目文件夹（已存在的文件将忽略）。
 */

const summaryAPI = require('./index');
const nmc = require('node-modules-custom');
const path = require('path');

const summStatu = new summaryAPI.summary();

/**@class */
class creater {
    constructor() {
        /** 是否使用文件名作为文档标题 title*/
        this._isUseFileBaseNameAsTitle = false;
        /** 附加的文档正文内容（比如某些特定模版内容）*/
        this._contentsToAppend = "";
        /** 不会被创建的文件（远程链接）匹配正则表达式*/
        this._ignores = summStatu.remoteHrefRegexp;
        /** 将会被创建的文档文件列表，默认值来自`summary.havenListedDocs()`*/
        this.listTobeCreated = summStatu.havenListedDocs();
        /** 文档头部模版
         * - default: 使用`#` 作为 H1 的 markdown 文件头部模版;
         * - equal: 使用`====` 作为 H1 标记的 markdown 文件头部模版；
         * - yaml: 使用 YAML 头的 markdown 文件头部模版；
         * - html(不可用，否则会对 markdown 类文件造成破坏——某些元素无法解析):
         *     - HTML 或者 htm 文件不易固定，但已在函数内部使用完整（常规的HTML5——EMMET `html!`展开）的基础模版。
        */
        this._headTemplates = {
            /** 使用`#` 作为 H1 的 markdown 文件头部模版;*/
            default: (title) => { return `# ${title}\n` },
            /** 使用`====` 作为 H1 标记的 markdown 文件头部模版；*/
            equal: (title) => { return `${title}\n====\n` },
            /** 使用 YAML 头的 markdown 文件头部模版；*/
            yaml: (title) => { return `---\ntitle: ${title}\n---` },
            /** HTML 或者 htm 文件不易固定，但已在函数内部使用完整（常规的HTML5——EMMET `html!`展开）的基础模版。*/
            html: (title, conten) => { return `<!DOCTYPE html>\n    <html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta http-equiv="X-UA-Compatible" content="ie=edge">\n    <title>Document</title>\n</head>\n<body>\n    <h1>${title}<h1>\n<p>${conten}<\p>\n</body>\n</html>`; }
        }
    }
    /** 
     * 默认的文档文件创建方式。
     * 
     * @param {string[][]} lists -将被创建的文件列表。
     * @param {string} contents -附加中文内容。
     * @description
     *  - 文档头部（示例）：`# titlt`
     *  - 以链接文本作为文档标题。
    */
    createDefault(lists, contents) {
        let tobeWrites = lists || this.listTobeCreated;
        let appends = contents || this._contentsToAppend;
        if (typeof (tobeWrites) !== "object") {
            
            throw console.error(`    ${__filename}:25:24 --> The param: 'lists' shuild be Object. likes: [[text,href],....]`);
        }
        for (let i = 0; i < tobeWrites.length; i++) {
            let item = tobeWrites[i];
            let doc_title = item[0];
            let doc_path = item[1];
            let fileType = path.extname(doc_path);
            if (this._ignores.test(doc_path) == false && fileType == ".html") {
                let doc = `${this._headTemplates["html"](doc_title, appends)}`;
                nmc.writeFileSyncLongBatch(doc_path, doc, false, { encoding: 'utf8' });
            } else if (fileType == ".md" || fileType == ".mdown" || fileType == ".markdown") {
                let doc = `${this._headTemplates.default(doc_title)}${appends}`;
                nmc.writeFileSyncLongBatch(doc_path, doc, false, { encoding: 'utf8' });
            }
        }
    };
    /** 
     * 依据一定的方式创建文档文件。
     * @method
     * @param {object} confs -配置项。
     * @param {string[][]|string[]} confs.lists -将要被创建的文件列表，默认从`this._contentsToAppend`继承。
     * @param {string} confs.contents -要附带的内容（**可以以模版形式添加到正文**）。默认：``。
     * @param {boolean} confs.useFileBaseNameAsTitle -是否以文件名作为文档标题。默认：`false`。
     * @param {string} confs.headTamplate -文档头部模版函数名称(**可以是完整的文档内容，但函数只会传入文档 title 作为参数**)。
     *  - 如果要自定义模版，需要在本函数之前定义模版（新增或者修改 `this._headTemplates`属性）
    */
    createrByConfs(confs = { lists: this.listTobeCreated, contents: this._contentsToAppend, useFileBaseNameAsTitle: false, headTamplate: "default" }) {
        let conf = confs || {}
        conf.lists = confs.lists || this.listTobeCreated;
        conf.contents = confs.contents || this._contentsToAppend;
        conf.useFileBaseNameAsTitle = confs.useFileBaseNameAsTitle || false;
        conf.headTamplate = confs.headTamplate || "default";

        let li = conf.lists;
        let ht = conf.headTamplate;

        function titleFromBaseName(fp) {
            let f1 = path.basename(fp);
            let f2 = f1.replace(path.extname(fp), "");
            return f2;
        }

        for (let i = 0; i < li.length; i++) {
            let item = li[i];
            let itemTitle;

            if (conf.useFileBaseNameAsTitle) {
                itemTitle = titleFromBaseName(item[1]);
            } else {
                itemTitle = item[0];
            }

            let itemPath = item[1];
            let fileType = path.extname(itemPath);
            let headTemp;
            if (fileType == ".html" || fileType == ".htm") {
                headTemp = this._headTemplates["html"](itemTitle, conf.contents);
                nmc.writeFileSyncLongBatch(itemPath, headTemp, false, { encoding: 'utf8', flag: 'w' });
            } else if (fileType == ".md" || fileType == ".mdown" || fileType == ".markdown") {
                headTemp = this._headTemplates[ht](itemTitle);
                let wdata = `${headTemp}\n${conf.contents}`;
                nmc.writeFileSyncLongBatch(itemPath, wdata, false, { encoding: 'utf8', flag: 'w' });
            }
        }
    }
}
module.exports = {
    creater
}