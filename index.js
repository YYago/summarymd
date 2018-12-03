'use strict';

const fs = require('fs');
const nmc = require('node-modules-custom');
const lodah = require('lodash');
const path = require('path');
const vinlyRead = require('vinyl-read');
const cheerio = require('cheerio');
const osType = require('os').type();
/** @class */
class summary {
    constructor() {
        /** 默认的全局文档匹配表达式*/
        this.includeDocs = ['./**/*.md', './**/*.html', './**/*.markdown', './**/*.mdown', './**/*.htm'];
        /** 默认的全局文档排除匹配表达式*/
        this.excludeDocs = ['!./node_modules/**/*.*', '!./_summary.md', './SUMMARY.md'];
        /** 默认的远程路径匹配正则表达式*/
        this.remoteHrefRegexp = /(\w\:\/|(\.\.\/)|(\:\\\\)|(\w+\:\d+)|\~\/|(\d.+\.\d).[\/|\:\?]?)|((\w\.[\w|\d]).*\/.+([\/]|\:\d|\.html|\.php|\.jsp|\.asp|\.py))/g;
        /** 默认的全局作用路径*/
        this.rootDir = process.cwd();
        /** summary.md 中的 link 匹配规则(*也许你需要重置它以满足自己的需求*).*/
        this._summLinkRegxp = /\]\(.*\.m(ar|d|k|down)+\)|\]\(.*\.ht(m|l)+\)/g;
        /** 对_summLinkRegxp 匹配到结果进行清理(*也许你需要重置它以满足自己的需求*).*/
        this._signBedelted = /^\]\(|\)$/g;

        this._linkRegxpMatch = /\*.*(\n|\r\n|\r)/g;
        this._linkRegxpReplace = {
            step1: /^.*(\*.+\[)/g,
            step2: /\)\n/g,
            step3: "]("
        }
    }
    /**
     * 获取当前路径下的所有 Markdown\HTML 类文件
     * @method
     * @param {string|string[]} ignoreDocs -要排除的文件。
     * 
     * 默认的配置来自 `summary.property.includeDocs` 及 `summary.property.excludeDocs`.
     */
    DocsFileList(ignoreDocs) {
        let wants;
        if (ignoreDocs == undefined) {
            wants = [...this.includeDocs, ...this.excludeDocs];
        } else if (typeof (ignoreDocs) == "object") {
            wants = [...this.includeDocs, ...this.excludeDocs, ...ignoreDocs];
        } else if (typeof (ignoreDocs) == "string") {
            wants = [...this.includeDocs, ...this.excludeDocs, ignoreDocs];
        }
        let vinyleRes = vinlyRead.sync(wants, { read: false });
        let rs_path = [];
        let rs_path_relative = [];
        if (!(vinyleRes == null)) {
            for (let i in vinyleRes) {
                let item = vinyleRes[i].path
                let item_relative = path.relative(this.rootDir, item);
                if (osType == "Windows_NT") {
                    item = item.replace(/\\/g, "/");
                    item_relative = item_relative.replace(/\\/g, "/");
                }
                rs_path.push(item)
                rs_path_relative.push(item_relative);
            }
        }
        return {
            resolve: rs_path,
            relative: rs_path_relative
        }
    };

    /** 
     * 获取已经被写进 `summary.md` 中的文件。
     * @method
     * @param {string} summaryFile -目录文件路径，默认：`'./SUMMARY.md'`。
     * @returns {Array}
     * @description 远程文件会被忽略(指向远程地址的 `URL` 以及指向当前文件夹以外的本地文件(像这种: "../example/..."))
    */
    havenListedDocs(summaryFile) {
        let listFile = summaryFile || path.join(this.rootDir, 'SUMMARY.md');
        let lfContent = fs.readFileSync(listFile, { encoding: 'utf8' });
        let matchByLinkRegxp = lfContent.match(this._summLinkRegxp)
        if (!(matchByLinkRegxp == null)) {
            let links_len = matchByLinkRegxp.length;
            let out_localFiles = [];
            let out_remoteFiles = [];
            for (let i = 0; i < links_len; i++) {
                let link_item = matchByLinkRegxp[i];
                let item = link_item.replace(this._signBedelted, "");
                // 远程地址过滤
                let isRemoter = this.remoteHrefRegexp.test(item);
                if (isRemoter == false) {
                    if (/\ /g.test(item)) {
                        console.log(`  WARN: The path "${item}" has blank space!!!`)
                    }
                    if (/[\u4e00-\u9fa5]/g.test(item)) {
                        console.log(`   WARN: The path "${item}" has [\\u4e00-\\u9fa5] !!!`)
                    }
                    out_localFiles.push(item);
                } else {
                    out_remoteFiles.push(item);
                }
            }
            console.log(`  Done! ......You can change the RegExp("SummaryStatus._RemoteHrefRegExp"${__filename}:85:12) to inclde or exclude files custom.`)
            return {
                Local: out_localFiles,
                Remote: out_remoteFiles
            };
        } else {
            console.log(`   Con't Match anything from "${summfile}".`);
            return
        }
    };

    /** 
     * 获取目录文件中的列表的链接的文本和地址
     * @method
     * @param {string} summaryFile -目录文件路径，默认：`'./SUMMARY.md'`。
     * @returns {string[][]} 返回格式: `[['About','docs/example.md'],...]`
     * 
    */
    li_link(summaryFile) {
        let sf = summaryFile || path.join(this.rootDir, 'SUMMARY.md');
        let sContent = fs.readFileSync(sf, { encoding: 'utf8' });
        let regRS = sContent.match(this._linkRegxpMatch);
        let beReturn = []; // 全部的结果
        if (!(regRS == null)) {
            for (let i = 0; i < regRS.length; i++) {
                let item_i = regRS[i];
                let bePushed = item_i.replace(this._linkRegxpReplace.step1, "");
                bePushed = bePushed.replace(this._linkRegxpReplace.step2, "");
                bePushed = bePushed.split(this._linkRegxpReplace.step3);
                beReturn.push(bePushed);
            }
            return beReturn;
        } else {
            console.log(`   Con't Match anything from ${sf}.`);
            return
        }
    };

    /** 
     * 获取目录文件中的列表的链接的文本和地址（不同于`li_link()`）
     * @method
     * @param {string} summaryFile -目录文件路径，默认：`'./SUMMARY.md'`。
     * @returns {string[][]} 返回格式：`[['example','docs/example.md'],...]`
     * @description
     * 原有的链接中的文本会被忽略，直接中路径中获取文件名(不含文件扩展名)：
     * @example
     * //* [About](docs/example.md)
     * // 将得到：
     * // [['example','docs/example.md']]
    */
    li_link_withBaseName(summaryFile) {
        let sf = summaryFile || path.join(this.rootDir, 'SUMMARY.md');
        let sContent = fs.readFileSync(sf, { encoding: 'utf8' });
        let vbfRst = sContent.match(this._summLinkRegxp);
        if (!(vbfRst == null)) {
            let vbfArr = [];

            for (let i = 0; i < vbfRst.length; i++) {
                let i_item = vbfRst[i];
                let itemRp = i_item.replace("](", "")
                itemRp = itemRp.replace(/\)$/g, "")
                let outItem = [(path.basename(itemRp)).replace(path.extname(itemRp), ""), itemRp];
                vbfArr.push(outItem);
            }
            return vbfArr;
        } else {
            console.log(`   Con't Match anything from ${sf}.`)
            return
        }
    };
}
/** @class*/
class getDocTitle {
    constructor() {
        /**
         * 测试和获取 md 内容的标题 `# title`
         */
        this._regMD_pound = /^[#]{1}[^#].+/g;
        this._regMD_pound_beRP = /^\#+\ +/g;

        /**
         * 测试和获取 md 内容的标题 
         * @example 
         *
         *'title'
         *'====='
         */
        this._regMD_equal = /^.+[\r\n]\=.+/g;
        this._regMD_equal_beRP = /[\n|\r]\=+/g;
        /**
         * 测试和获取 md 内容的 YAML 头标题
         */
        this._regMD_yaml_1 = /^(-){3}.*[\W\w]*\-{3}$/g;
        this._regMD_yaml_2 = /^(title)\W.+[\b\W]/g;
        this._regMD_yaml_beRP = /(title:) *|(title.+:) */g;

        /**
         * 从传入的内容中获取 title
         * @method fromContent
         * @param {string} str  -Contents
         * @param {string} types  -Type: can be `"md"` \ `html` or `markdown`.
         * 
         * @example
         * getTitle.fromContent(str,type)
         */
    };
    fromContent(str) {
        let types = arguments[1] || ".md";
        let strs = str;
        let content_title;
        if (types == ".md" || types == ".markdown" || types == ".mdown") {// TODO: emmm，继续猜......
            // title with '#'
            if (this._regMD_pound.test(strs)) {
                let regR = strs.match(this._regMD_pound);
                regR = regR[0];
                regR = regR.replace(this._regMD_pound_beRP, "");
                content_title = regR;
                // title with '==='
            } else if (this._regMD_equal.test(strs)) {
                let regR = strs.match(this._regMD_equal);
                regR = regR[0];
                regR = regR.replace(this._regMD_equal_beRP, "");
                content_title = regR;
                // title with YAML
            } else if (this._regMD_yaml_1.test(strs)) {
                let regR = strs.match(this._regMD_yaml_1);
                regR = regR[0];
                regR = regR.match(this._regMD_yaml_2)[0];
                regR = regR.replace(this._regMD_yaml_beRP);
                content_title = regR;
            }
        } else if (types == "html" || types == "htm") {
            let $ = cheerio.load(strs);
            let title = $('h1').first().text()
            content_title = title;
        }
        return content_title
    }
    /**
     * 从 markdown 文件中获取 title
     * @method
     * @param {string} FilePath -Markdown file path.
     * @returns {object} 
     * @property {string} title
     * @property {array} summary_link_with_title
     */
    fromMarkdon(FilePath) {
        let str = fs.readFileSync(FilePath, { encoding: 'utf8' });
        let fType = path.extname(FilePath);
        let ftitle = this.fromContent(str, fType);
        return {
            title: ftitle,
            summary_link_with_title: [ftitle, FilePath]
        }
    }
    /** It's so......
     * 
     * we can use the module cheerio to control it. be easier.
     * 
     * @method
     * @param {FilePath} FilePath  -HTML filepath.
     * @returns {object}
     * @property {string} title -The First H1 of HTML.
     * @property {array} summary_link_with_title -[title, FilePath]
    */

    fromHTML(FilePath) {
        let str = fs.readFileSync(FilePath, { encoding: 'utf8' });
        let $ = cheerio.load(str);
        let title = $('h1').first().text()
        return {
            title: title,
            summary_link_with_title: [title, FilePath],
        }
    }
    /**
     *  for `SUMMARY.md` link use file basename.
     * @param {string} FilePath - 路径
     * @example 
     * 
     * `* [myDoc](docs/new/myDoc.md)`
     */
    summaryLink_with_filebasename(FilePath) {
        return [path.basename(FilePath), FilePath];
    }
}

module.exports = {
    summary,
    getDocTitle
}