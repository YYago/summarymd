const fs = require('fs');
const lodash = require('lodash');
const path = require('path');
const nmc = require('node-modules-custom');
const vinlyRead = require('vinyl-read');
const cheerio = require('cheerio');
const osType = require('os').type();
const markit = require('markdown-it');
const mkit = new markit();

class SummaryMd {
    constructor() {
        this.configs = {
            includes: ['./**/*.md', './**/*.markdown'],
            excludes: ['!./node_modules/**/*.*'],
            /**
             * Official directory file path.
             */
            summary: "./SUMMARY.md",
            confs_with_create: {
                /**
                 * Whether to skip lists with empty URLs or empty link text when creating files.
                 */
                isSkipEmptyTitleOrEmptyPath: true,
                /**
                 * Remote Path Matching Rules--This package does not handle any remote paths unless the matched rules fail to match.
                 */
                remoteURLregexp: /(\w\:\/|(\.\.\/)|(\:\\\\)|(\w+\:\d+)|\~\/|(\d.+\.\d).[\/|\:\?]?)|((\w\.[\w|\d]).*\/.+([\/]|\:\d|\.html|\.php|\.jsp|\.asp|\.py))/g,
            },
            confs_with_summary: {
                /**
                 * Temporary directory file path
                 */
                tempSummary: "./_summary.md",
                /**
                 * Whether to use the base file name as link text.
                 */
                isUseBFasLinkText: false,
                /**
                 * Markdown list Tags.
                 */
                listSing: "*",
                /**
                 * Whether to perform URL encoding for links in the directory list.
                 */
                isEncodeURI: false,
                indent: {
                    /**
                     * @type {RegExp}
                     * @description If `false`, subsequent indentation settings will be ignored. No indentation is performed.
                     */
                    isIndent: true,
                    /**
                     * Number of single indentation spaces
                     */
                    indentLength: 4,
                    /**
                     * @type {object}
                     * @description Custom indentation rules.
                     * 
                     * - IndentByDirs: Indentation rules act on file paths.
                     * - IndentByTitle: Indentation rules act on article titles.
                     * - object key——basis: The rule to indent by. type: RegExp.
                     * - object key——times: Indentation times.
                     * 
                     * NOTE:
                     * You can't set them up at the same time. You can only choose one way to generate temporary directory files. Set both to null if you don't need to customize indentation rules.
                     * @example
                     * IndentByDirs: [
                     *  {basis:/npm/,times:1},
                     *  {basis:/java/,times:2}
                     * ]
                     */
                    IndentByDirs: null,
                    /**@see  IndentByDirs*/
                    IndentByTitle: null,
                }
            }
        };
        this.excludes = [this.configs.excludes, '!' + this.configs.summary, '!' + this.configs.confs_with_summary.tempSummary]
    }
    // matheds
    localDocs() {
        let docs = lodash.flattenDeep([this.configs.includes, this.excludes]);
        try {
            let vinyleRes = vinlyRead.sync(docs, { read: false });
            let rs_path_relative = [];
            if (!(vinyleRes == null)) {
                for (let i in vinyleRes) {
                    let item = vinyleRes[i].path
                    let item_relative = path.relative(process.cwd(), item);
                    if (osType == "Windows_NT") {
                        item = item.replace(/\\/g, "/");
                        item_relative = item_relative.replace(/\\/g, "/");
                    }
                    rs_path_relative.push(item_relative);
                }
            }
            let localFileDocs = [];
            for (let y = 0; y < rs_path_relative.length; y++) {
                try {
                    let doc = fs.readFileSync(rs_path_relative[y], "utf8");
                    let docType = path.extname(rs_path_relative[y]);
                    let docConent
                    if (lodash.includes(['.md', '.markdown'], docType) == true) {
                        docConent = mkit.render(doc);
                    } else if (lodash.includes(['.html', '.htm'], docType) == true) {
                        docConent = doc;
                    }
                    let $ = cheerio.load(docConent);
                    let title = $('h1').text()
                    let link_href = rs_path_relative[y]
                    let lilink = { title: title, path: link_href }
                    localFileDocs.push(lilink);
                } catch (e) {
                    throw Error(__filename + ":116 " + e)
                }
            }
            return {
                docPaths: rs_path_relative,
                docs: localFileDocs
            }
        } catch (e) {
            throw Error(__filename + ":124 " + e);
        }
    }
    summaryList() {
        let docs
        if (fs.existsSync(this.configs.summary) == false) {
            console.warn(`  summarymd WARA: -> ${__filename}:130 -> 'configs.summary':"${this.configs.summary}" not exists! If it not your summary file,please setting the true path!`)
            docs = [{ title: null, path: null }];
            return docs;
        }
        let summaryContent = fs.readFileSync(this.configs.summary, { encoding: 'utf8' });
        let summRender = mkit.render(summaryContent)
        let $ = cheerio.load(summRender)
        if ($('li a').length == 0) {
            docs = [{ title: null, path: null }];
            console.warn(`  summarymd WARA: -> ${__filename}:139 => Can't find any "<a>...</a>" in ${this.configs.summary}!`)
            return docs;
        }
        if (this.configs.confs_with_summary.isUseBFasLinkText) {
            docs = $('li a').map((i, el) => {
                let item_path = $(el).attr('href')
                if (this.configs.confs_with_create.remoteURLregexp.test(item_path) == false && item_path !== undefined) {
                    return { title: path.basename(item_path).replace(path.extname(item_path), ""), path: item_path }
                }
            }).get()
        } else {
            docs = $('li a').map((i, el) => {
                let item_title = $(el).text();
                let item_path = $(el).attr('href');
                if (this.configs.confs_with_create.remoteURLregexp.test(item_path) == false && item_path !== undefined) {
                    return { title: item_title, path: item_path }
                }
            }).get()
        }
        return docs;
    }
    /**
     * Print the path and link text of the files which not exists ,It's let your know that has some problems in summary lists.
     * 
     * - Note : It only check local paths and link texts from 'summaryList()' .
     */
    _summaryStatus_hasProblems() {
        let beChecks = this.summaryList()
        let problem_with_URL = [];
        let problem_with_Text = [];
        for (let i = 0; i < beChecks.length; i++) {
            let c_path = beChecks[i].path;
            if (fs.existsSync(c_path) == false || c_path == "") {

                problem_with_URL.push(beChecks[i])
            }
            if (beChecks[i].title == "") {

                problem_with_Text.push(beChecks[i])
            }
        }
        if(problem_with_URL.length>0){
            for(let i in problem_with_URL){
                console.warn(`summarymd WARN : This file not exists or without href--${JSON.stringify(problem_with_URL[i])}`);
            }
        }
        if(problem_with_Text.length>0){
            for(let i in problem_with_Text){
                console.warn(`summarymd WARN : These links do not have text--${JSON.stringify(problem_with_Text[i])} `);
            }
        }
        return {
            problem_with_URL,
            problem_with_Text
        }
    }
    /**
     * The list use to update summary lists.
     */
    docs_not_listed_in_summary() {
        let notlists = lodash.difference(this.localDocs().docs, this.summaryList())
        return notlists
    }
    /**
     * Create the files from summary.
     * 
     * @param {function} template The function to return template.Note:You must define at least one string parameter to define the title of the article, even if you don't need it.
     * 
     * If 'template()' was undefined , will write the content like "# title" to the new file.
     */
    create(template) {
        let beCreated = this.summaryList();
        for (let i = 0; i < beCreated.length; i++) {
            let ite_title = beCreated[i].title;
            let ite_path = beCreated[i].path;
            let content = template(ite_title) || `# ${ite_title}\n`;
            if (this.configs.confs_with_create.isSkipEmptyTitleOrEmptyPath==true) {
                if (ite_path !== "" && ite_title !== "") {
                    nmc.writeFileSyncLongBatch(ite_path, content, false, { encoding: 'utf8', flag: 'w' });
                }else{

                }
            } else if (this.configs.confs_with_create.isSkipEmptyTitleOrEmptyPath == false) {
                nmc.writeFileSyncLongBatch(ite_path, content, false, { encoding: 'utf8', flag: 'w' });
            }
        }
    }
    update() {
        let tabLen = this.configs.confs_with_summary.indent.indentLength;
        let liSign = this.configs.confs_with_summary.listSing;
        let isIndent = this.configs.confs_with_summary.indent.isIndent;
        let temSumm = this.configs.confs_with_summary.tempSummary;
        let isUFBAT = this.configs.confs_with_summary.isUseBFasLinkText;
        let isEncoding = this.configs.confs_with_summary.isEncodeURI;
        let indentBydirs = this.configs.confs_with_summary.indent.IndentByDirs;
        let indentByTitle = this.configs.confs_with_summary.indent.IndentByTitle;
        let beUpdates = this.docs_not_listed_in_summary();
        if (temSumm == this.configs.summary) {
            console.error(` summarymd -> ${__filename}:237 => The path of the Temporary Summary file was sames as the real Summary file!!! It will bring you big trouble!!!`)
            return
        }
        function dirLength(docpath) {
            try {
                let prefixRegexp = /(^\.\/)|(^\/)/g;
                let hrefn = docpath.replace(prefixRegexp, "");
                let pLeng = hrefn.match(/\//g);
                let pl
                if (pLeng == null) {
                    pl = 0;
                } else {
                    pl = pLeng.length;
                }
                return pl;
            } catch (e) {
                throw new Error(" summarymd -> " + __filename + ':253 =>' + e)
            }
        }
        let notes =
            `
注意：
1. 这是临时的目录文件。
2. 文档的先后顺序可能需要你手动调整之后复制到正式的目录文件中。
3. 你可以通过更改配置文件或者模块的全局配置的变量来得到你想要的生成目录方式。配置项详细说明:[CONFIGS](https://gitee.com/class877/summarymd#-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%AF%B4%E6%98%8E)
4. 请将本文件添加到“.gitignore”的排除文件列表中。

NOTE:
1. This is a temporary directory file.
2. The order of documents may need to be manually adjusted and copied to a formal directory file.
3. You can change the configuration file or the global configuration variables of the module to get the way you want to generate the directory. Configuration details: [CONFIGS](https://github.com/YYago/summarymd#-configuration-file-description)
4. Please add this document to the list of excluded files of ".gitignore".

Temporary SUMMARY:

----

`;
        try {
            fs.writeFileSync(temSumm, notes, { encoding: 'utf8', flag: 'w' });
        } catch (e) {
            console.error(" summarymd -> " + __filename + ":278 => " + e)
        }
        if (isIndent == false) {
            for (let i = 0; i < beUpdates.length; i++) {
                let i_title = beUpdates[i].title;
                let i_path = beUpdates[i].path;
                let line;
                if (isEncoding) {
                    i_path = encodeURI(i_path);
                }
                if (isUFBAT) {
                    let UFBAT = path.basename(i_path).replace(path.extname(i_path), "")
                    line = `${liSign} [${UFBAT}](${i_path})\n`;
                } else {
                    line = `${liSign} [${i_title}](${i_path})\n`;
                }
                fs.writeFileSync(temSumm, line, { encoding: 'utf8', flag: 'a' });
            }
        } else {
            if (indentByTitle !== null && indentBydirs !== null) {
                console.error(` summarymd -> ${__filename}:298 => You can't define two indentation modes at the same time.————"confs_with_summary.indent.IndentByDirs" and "confs_with_summary.indent.IndentByTitle" `)
                return
            }
            if (indentByTitle == null && indentBydirs == null) {
                for (let i = 0; i < beUpdates.length; i++) {
                    let i_title = beUpdates[i].title;
                    let i_path = beUpdates[i].path;
                    let indentTimes = dirLength(i_path);
                    if (isEncoding) {
                        i_path = encodeURI(i_path);
                    }
                    let line;
                    if (isUFBAT) {
                        let UFBAT = path.basename(i_path).replace(path.extname(i_path), "")
                        line = `${" ".repeat(tabLen * indentTimes)}${liSign} [${UFBAT}](${i_path})\n`;
                    } else {
                        line = `${" ".repeat(tabLen * indentTimes)}${liSign} [${i_title}](${i_path})\n`;
                    }
                    fs.writeFileSync(temSumm, line, { encoding: 'utf8', flag: 'a' });
                }
                return
            }
            if (indentByTitle !== null && indentBydirs == null) {
                let Bys = indentByTitle;
                for (let b = 0; b < Bys.length; b++) {
                    let bitem_find = Bys[b].basis;
                    let bitem_times = Bys[b].times;
                    try {
                        fs.writeFileSync(temSumm, `### IndentBy: \`${bitem_find}\`:\n\n----\n\n`, { encoding: 'utf8', flag: 'a' })
                    } catch (e) {
                        throw Error(e)
                    }
                    for (let i = 0; i < beUpdates.length; i++) {
                        let i_title = beUpdates[i].title;
                        let i_path = beUpdates[i].path;
                        let indentTimes
                        if (bitem_find.test(i_title)) {
                            indentTimes = bitem_times;
                            if (isEncoding) {
                                i_path = encodeURI(i_path);
                            }
                            let line;
                            if (isUFBAT) {
                                let UFBAT = path.basename(i_path).replace(path.extname(i_path), "")
                                line = `${" ".repeat(tabLen * indentTimes)}${liSign} [${UFBAT}](${i_path})\n`;
                            } else {
                                line = `${" ".repeat(tabLen * indentTimes)}${liSign} [${i_title}](${i_path})\n`;
                            }
                            fs.writeFileSync(temSumm, line, { encoding: 'utf8', flag: 'a' });
                            // remov has added doc.
                            lodash.pull(beUpdates, beUpdates[i]);
                            if (beUpdates.length == 0) {
                                return
                            }
                        }
                    }
                }
                if (beUpdates.length > 0) {
                    for (let i = 0; i < beUpdates.length; i++) {
                        let i_title = beUpdates[i].title;
                        let i_path = beUpdates[i].path;
                        let line;
                        if (isEncoding) {
                            i_path = encodeURI(i_path);
                        }
                        if (isUFBAT) {
                            let UFBAT = path.basename(i_path).replace(path.extname(i_path), "")
                            line = `${liSign} [${UFBAT}](${i_path})\n`;
                        } else {
                            line = `${liSign} [${i_title}](${i_path})\n`;
                        }
                        fs.writeFileSync(temSumm, line, { encoding: 'utf8', flag: 'a' });
                    }
                    return
                }
            }
            if (indentByTitle == null && indentBydirs !== null) {
                let Bys = indentBydirs;
                for (let b = 0; b < Bys.length; b++) {
                    let bitem_find = Bys[b].basis;
                    let bitem_times = Bys[b].times;
                    try {
                        fs.writeFileSync(temSumm, `### IndentBy: \`${bitem_find}\`:\n\n----\n\n`, { encoding: 'utf8', flag: 'a' })
                    } catch (e) {
                        throw Error(e)
                    }
                    for (let i = 0; i < beUpdates.length; i++) {
                        let i_title = beUpdates[i].title;
                        let i_path = beUpdates[i].path;
                        let indentTimes
                        if (bitem_find.test(i_path)) {
                            indentTimes = bitem_times;
                            if (isEncoding) {
                                i_path = encodeURI(i_path);
                            }
                            let line;
                            if (isUFBAT) {
                                let UFBAT = path.basename(i_path).replace(path.extname(i_path), "")
                                line = `${" ".repeat(tabLen * indentTimes)}${liSign} [${UFBAT}](${i_path})\n`;
                            } else {
                                line = `${" ".repeat(tabLen * indentTimes)}${liSign} [${i_title}](${i_path})\n`;
                            }
                            fs.writeFileSync(temSumm, line, { encoding: 'utf8', flag: 'a' });
                            // remov has added doc.
                            lodash.pull(beUpdates, beUpdates[i]);
                            if (beUpdates.length == 0) {
                                return
                            }
                        }
                    }
                }
                if (beUpdates.length > 0) {
                    for (let i = 0; i < beUpdates.length; i++) {
                        let i_title = beUpdates[i].title;
                        let i_path = beUpdates[i].path;
                        let line;
                        if (isEncoding) {
                            i_path = encodeURI(i_path);
                        }
                        if (isUFBAT) {
                            let UFBAT = path.basename(i_path).replace(path.extname(i_path), "")
                            line = `${liSign} [${UFBAT}](${i_path})\n`;
                        } else {
                            line = `${liSign} [${i_title}](${i_path})\n`;
                        }
                        fs.writeFileSync(temSumm, line, { encoding: 'utf8', flag: 'a' });
                    }
                    return
                }
            }
        }
    }
}

module.exports = SummaryMd