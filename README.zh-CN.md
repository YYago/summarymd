# summarymd

>之前不怎么用 Gitbook ，后来发现 summarymd 实现的功能类似 Gitbook 的 “gitbook init” 命令。

**V2.0.0是一个全新的版本，以前的接口不再支持！！！**

summarymd 可以：
1. summarymd 让文件的创建过程可控，可定制。
   * 你可以决定用哪种标题标记——你可以用“# ”、“=”、自定义的YAML头等；
     >YAML 头并不能被准确解析（本模块依赖 markdown-it 解析 markdown ）。这会影响生成临时目录的准确性。除非你在 YAML 头之后增加一个能解析为 `<h1>...<h1>` 的 markdown 标记。
   * 你可以批量追加某些特定的文本内容，而不是像 Gitbook 一样仅创建一个带有标题的空文档。
2. summarymd 让生成目录列表的方式变得可控。
   * 可变的链接文本——你可以用文件名作为链接文本而不用管文章的标题；
   * v2.0.0+版本支持根据匹配特定字符（路径或者标题中的字符是否被正则表达式匹配到）进行缩进，忽略文件夹的嵌套关系。这便于把相似或者相关内容的文档分到一组。
   * 支持每级文件夹缩进一次（默认的缩进方式）。
   > 使用缩进是为了便于理清文档先后顺序——对于那些没有列入 summary 清单文件的文档，在列入之前你需要手动调整文档顺序，然后手动追加到真正的 summary 文件（比如 `summary.md`）中。（这个包生成的 summary 列表只是个临时的 markdown 文件，默认文件名："_summary.md"）。
3. 打印`SUMMARY.md`中列表存在的问题：
    * 不存在的文件路径（原文件被删、被移动、被重命名、空路径、或者路径不准确等，当然可能是还没创建）,但 `SUMMARY.md` 没有修正或者创建这个文件。
    * 没有文本的链接。例如：`[](doc/example.md)`
    > 这个设计只在命令行中有体现：` summarymd status ` 或者 ` summarymd -s `，如果要在项目模块中使用，可通过 `._summaryStatus_hasProblems().problem_with_URL` 和 `._summaryStatus_hasProblems().problem_with_Text` 获取对应的返回值。

## 安装

1. 安装到项目：
   
   ```
   npm i summarymd
   ```

2. 全局安装：

    ```
    npm i -g summarymd
    ```
    > 全局安装之后运行 `summarymd -h` 来获取命令行支持的功能以及用法。

## 使用

### 1. 引入到项目。

```js
    const summarymd = require('summarymd')
    const sm = new summarymd() // must use with new

    // change configs
    
    // 在创建文件时用文件名作为文档一级标题。
    sm.configs.confs_with_create.isUseFileBasenameAsTitle = true; 
    
    // 用“+”作为列表标记。
    sm.configs.confs_with_summary.listSing ='+'; 
    //...... 你可以更改更多的配置项来创建文件或生成临时目录

    // 根据 summary 文件创建 markdown 文件。
    sm.create((t)=>{return `# ${t}\n[TOC]`})
    /* 文件创建之后的内容类似:
        # example
     
        [TOC]
    
    */ 

    sm.update() // 生成临时目录。
```

### 2. 全局安装，作为命令使用。

> 配置项较多，单纯使用命令参数来处理会比较麻烦，我们通过配置文件来处理如何创建文件以及如何更新临时目录。

* 首先，创建配置文件到项目工作路径下(`summaryConfig.js`)：
    ```bash
    summarymd init
    ```
    >如果要重置配置文件，执行 `summarymd reinit`。

* 接着，根据自己的需要更改配置文件并保存，比如设置缩进、列表标记、文档模板函数等。
* 完成前面两步，现在可以用命令工作了：
    ```bash
    summarymd create
    ```
    >用 create 创建文件。
    ```bash
    summarymd update
    ```
    > 用 update 更新临时目录。
    ```bash
    summary watch
    ```
    > 用 watch 自动监视文件变化，自动执行 `summarymd create` 和 `summarymd update` 操作。

<h2 id="confs"> 配置文件说明</h2>

### 1. 项目引用时通过 new 关键字使用，然后再重新赋值给指定的配置项。

源码：

```js
this.configs = {
        // 要处理的文件（路径要补全，即使"./SUMMARY.md" 和 "SUMMARY.md" 等效，但必须写成"./SUMMARY.md"）
        includes: ['./**/*.md', './**/*.markdown'],
        // 正式的目录文件路径（路径要补全，即使"./SUMMARY.md" 和 "SUMMARY.md" 等效，但必须写成"./SUMMARY.md"）
        summary: "./SUMMARY.md",
        // 创建文件的配置
        confs_with_create: {
            // 是否使用文件名作为文档标题。
            isUseFileBasenameAsTitle: false,
            // 远程路径匹配表达式(无法创建远程文件，如果可以你可以尝试下载它们，但这里只能将其排除)
            remoteURLregexp: /(\w\:\/|(\.\.\/)|(\:\\\\)|(\w+\:\d+)|\~\/|(\d.+\.\d).[\/|\:\?]?)|((\w\.[\w|\d]).*\/.+([\/]|\:\d|\.html|\.php|\.jsp|\.asp|\.py))/g,
        },
        // 更新临时目录的配置
        confs_with_summary: {
            // 临时目录文件路径（路径要补全，即使"./SUMMARY.md" 和 "SUMMARY.md" 等效，但必须写成"./SUMMARY.md"）
            tempSummary: "./_summary.md",
            // 是否用文件名作为目录列表的链接的文本。
            isUseBFasLinkText: false,
            // 列表标记符号
            listSing: "+",
            // 是否对链接进行编码
            isEncodeURI: false,
            // 目录列表缩进的配置
            indent: {
                // 是否使用缩进。
                isIndent: true,
                // 缩进长度
                indentLength: 4,
                // 按 路径|标题 缩进
                /**
                 * 
                 * 必须是这样的格式（IndentByDirs 和 IndentByTitle 都是）： 
                 * @example
                 * 
                 * [ { basis:/\/js\//, times:1 }, ...] 
                 * 
                 * basis: 缩进规则，最好是正则表达式，因为代码中都是用 basis.test() 方法来测试是否匹配缩进规则的。
                 * times: 缩进次数，必须是数值，最终的缩进量 = indentLength * times
                 * 
                 * 注意:
                 * 
                 * 不能同时定义 IndentByDirs 和 IndentByTitle 。定义了一个，另一个则应该为 null。
                */
                IndentByDirs: null, 
                /** @see IndentByDirs*/
                IndentByTitle: null,
            }
        }
    };
    // 要排除的文件。
    this.excludes = ['!./node_modules/**/*.*','!'+this.configs.summary,'!'+this.configs.confs_with_summary.tempSummary]
```

### 2. 作为命令行使用时的配置说明

配置文件通过 ：`summarymd init` 生成。生成的文件为：`./summaryConfig.js` 。它的内容如下：

```js
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
        remoteURLregexp: /(\w\:\/|(\.\.\/)|(\:\\\\)|(\w+\:\d+)|\~\/|(\d.+\.\d).[\/|\:\?]?)|((\w\.[\w|\d]).*\/.+([\/]|\:\d|\.html|\.php|\.jsp|\.asp|\.py))/g,
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
```

这与模块引用方法差不多，只是为了尽可能简单地重新定义默认值因而做了一些改变......总之感觉很复杂！使用JSON格式的配置文件不方便使用可变型的追加内容——尤其在批量创建新文档的时候，比如日期、时间这些可变的内容。比较了下，比起使用命令行还不如直接部署一个临时npm项目......