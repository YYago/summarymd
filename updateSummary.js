'use strict';

/**
 * @file updateSummary.js
 * @description 
 *  
 *  创建` _summary.md `(默认) 文件，将未被加入到` SUMMARY.md `的文件列入其中，简单地说是批量生成链接。**已存在于 `SUMMARY.md` 的文件将不会再列出**。
 *  
 * 注意：
 * 
 *  - 使用 Git 等工具提交时应注意 `_summary.md` 是否应该随文档一起提交。它只是个临时文件，应该在执行提交之前删掉它或者将其添加到类似 `.gitignore` 中默认排除在项目文件之外。
 *  - 相应地，如果有配置文件（使用 `zz config` 命令时创建的配置文件）：`summarymd.json` , 它是临时目录更新、批量创建文件的任务配置文件。若是团队协作，则应该保留并提交（如果成员都用 summarymd 包的话——使用相同的配置可以保证处理方式的一致性）。
 * 反之，则应该在提交之前删除或者添加到类似 `.gitignore` 中，避免混入项目文件中。
 */

const fs = require('fs');
const lodash = require('lodash');
const summApi = require('./index');

const gTitle =new summApi.getDocTitle();
const gSumm = new summApi.summary();

/** @class*/
class updateSummary {
    constructor() {
        /** 
         * 是否使用缩进
         * 
         * - 如果 `false`,则后续的关于缩进的设置不生效。
        */
        this._conf_isIndent = true;
        /** 缩进空格数*/
        this._conf_spaceLength = 4;
        /** 列表前缀符*/
        this._conf_liSign = "*";
        /** 是否用文件名作为链接文本*/
        this._conf_usFileBaseNameAsLinkText = false;
        /** 是否对路径进行URL编码。(主要针对空格路径和中文字符，这个可能因托管平台而异，不确定可默认为false)*/
        this._conf_EncodeURI = false;
        /** 是否已文件夹作为缩进依据（默认以文件夹层级(深度)数作为缩进依据，选 `true`则只分三级(仅会缩进两级，三层目录之后不再继续缩进)）*/
        this._conf_indentByDir = false;
        /** 更新目录的文件源 `['filepath0',filepath1,...]`*/
        this._conf_lists = lodash.difference(gSumm.DocsFileList().relative, gSumm.havenListedDocs());
        /** 输出临时目录文件到？*/
        this._conf_out = "./_summary.md";
    };
    /**
     * 返回由多个 `["linkText","linkHref"]` 组成的数组(使用文件名作为链接文本的情形)。
     * 
     * @param {string[]} listArr -由文件路径组成的数组。
     * @returns {string[][]} 返回的结构类似`[["linkText","linkHref"],...]`
     */
    usFBNALT(listArr) {
        let Text_Herf = [];
        for (let i in listArr) {
            let item = listArr[i];
            let bpush = gTitle.summaryLink_with_filebasename(item);
            Text_Herf.push(bpush);
        }
        return Text_Herf;
    };
    /**
     * 返回由多个 `["linkText","linkHref"]` 组成的数组(默认情形——由文档 title 作为链接文本)。
     * 
     * @param {string[]} listArr -由文件路径组成的数组。
     * @returns {string[][]} 返回的结构类似`[["linkText","linkHref"],...]`
     */
    notFBNALT(listArr) {
        let Text_Herf = [];
        for (let i in listArr) {
            let item = listArr[i];
            let bpush = gTitle.fromFile(item).summary_link_with_title;
            Text_Herf.push(bpush);
        }
        return Text_Herf;
    };
    /**
     * 更新生成临时目录列表（默认会得到 `./_summary.md` 文件）。
     * @method
     * @param {object} fnOptions -配置属性
     * @param {string[][]} fnOptions.lists -将要创建的对应文件的 title 和 path 组合数组，默认继承自属性：`this._conf_lists`。
     * @param {boolean} fnOptions.isIndent -是否缩进。如果` false `,则后续的与缩进相关的设置不会生效。默认：`true`。
     * @param {number} fnOptions.TabLength -Tab键所占空格数，默认: `4`（这与你在编辑器上的设置没有关系，仅指单个缩进的所占字符长度）。
     * @param {boolean} fnOptions.usFileBaseNameAsLinkText -是否用文件名作为链接文本，默认：`false`。
     * @param {string} fnOptions.liSign -li 标记符，默认：`*`(会进行 .trim() 处理)。
     * @param {boolean} fnOptions.EncodeURI -是否对 href 进行 encodeURI() 处理——带空格（汉字等）的路径会导致404。
     * - （当然，这取决于最终文档托管的平台如何处理，如果不确定保持默认值：` false `）。
     * @param {boolean} fnOptions.indentByDir -是否以文件夹作为缩进依据，默认：`false`。
     * - 如果` true`，那么将从当前目录的第二层文件夹开始缩进，默认地只会进行缩进最多2次而不管路径层级有多深。
     * - 如果` false `，则每一层文件夹都缩进——层级越多缩进长度越长。
     * @param {boolean} fnOptions.out -输出临时文件到？，默认：`./summary.md`。
     */
    summaryUpdate(fnOptions = { lists: this._conf_lists, isIndent: true, TabLength: 4, usFileBaseNameAsLinkText: false, liSign: "*", EncodeURI: false, indentByDir: false, out: "_summary.md" }) {
        let opts = fnOptions || {};
        opts = {
            lists: fnOptions.lists || this._conf_lists,
            isIndent: fnOptions.isIndent !== false,
            spaceLength: fnOptions.TabLength || 4,
            usFBNALT: fnOptions.usFileBaseNameAsLinkText !== false,
            liSign: fnOptions.liSign || "*",
            EncodeURI: fnOptions.EncodeURI !== false,
            indentByDir: fnOptions.indentByDir !== false,
            out: fnOptions.out || "./_summary.md",
        }
        let ups;
        if (opts.usFBNALT) {
            ups = this.usFBNALT(opts.lists);
        } else {
            ups = this.notFBNALT(opts.lists);
        }
        let wdata = [];
        for (let i = 0; i < ups.length; i++) {
            let ite = ups[i];
            let ite_text = ite[0];
            let ite_href = ite[1];
            let link_href;
            // 处理 encodeURI?
            if (opts.EncodeURI) {
                link_href = encodeURI(ite_href);
            } else {
                link_href = ite_href
            };
            let bsL;
            // 处理 isIndent 相关
            if (opts.isIndent && opts.indentByDir) {
                bsL = gSumm.li_indent(ite_href).byDir;
            } else if (opts.isIndent && opts.indentByDir == false) {
                bsL = gSumm.li_indent(ite_href).default;
            } else if (opts.isIndent == false) {
                bsL = 0;
            };
            // 构建单个 li
            let spLen = bsL * opts.spaceLength;
            let prefixIdent = ` `.repeat(spLen);
            let LiSignSp = opts.liSign.trim()
            let bepush = `${prefixIdent}${LiSignSp} [${ite_text}](${link_href})`;
            wdata.push(bepush);
        }
        let wdatas = wdata.join('\n');
        fs.writeFileSync(opts.out, wdatas, { encoding: 'utf8', flag: 'w' });
    };
}

module.exports = updateSummary