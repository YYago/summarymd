# summarymd

围绕 `SUMMARY.md` 文件工作的工具。

* 适用项目(平台)类型：
    - GitBook
    - 看云文档
* 适用场景：
    - 批量创建文档项目大纲中的文件。
    - 批量为已有文档创建目录列表文件。
    - 自动实时生成目录（*不会覆盖正式目录*）创建文件。
* 适合人群：
    - Markdown 重度用户。
    - 经常在文档、目录间切换的同学（我眼神不好，会经常弄错章节顺序以及章节和文档路径的对应关系）。

#### 安装教程

1. 安装到项目：
   
   ```
   npm i summarymd
   ```

2. 全局安装：

    ```
    npm i -g summarymd
    ```
    > **推荐**： 以命令行方式使用，易于保持文档项目整洁。

#### 使用说明

* 使用模块：
    ```js
    // use new ......

    const smdBase = require('summarymd');
    const smd_summ = new smdBase.summary();
    // ......

    // require summary.md update module

    const summUp = require('summarymd/updateSummary');
    const summ_update = new summUp.summaryUpdate();
    ```

* 使用命令：

   > 命令： `zz [option]`

   |参数|描述|
   -----|----
    `help`    |帮助。
    `config`  |创建配置文件： '`summarymdConf.json`'。[详细配置项说明](http://class877.gitee.io/summarymd)
    `update`  |更新临时目录，会生成 '_summary.md' 文件。它的内容格式与 "`SUMMARY.md`" 文件类似。
    `create`  |创建 "`SUMMARY.md`" 中已列出但不存在的文件(远程路径以及已经存在的文件会忽略掉)。
    `watch`   |监视，当文件状态发生变化时自动执行 `zz update` 和 `zz create`。<br>*谨慎开启监视器（因失误写的错误的路径会导致创建多余或者错误的文件）。*

> 写完 DEMO 就走人的水平，希望凌乱的 [Summarymd](http://class877.gitee.io/summarymd) 能稍微减轻头晕眼花。

#### 参与贡献

1. Fork 本项目
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request