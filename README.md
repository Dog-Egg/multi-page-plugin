# Multi-Page Plugins
简化 webpack 多页面配置的插件，内部使用 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 创建HTML文件。

## 安装
```shell script
npm install -D multi-page-plugin
```

## 用法
```
# 示例项目结构

project
├── src
│   ├── page1
│   │   ├── v1
│   │   │   ├── index.js
│   │   │   └── page.config.js
│   │   └── v2
│   │       ├── index.js
│   │       └── page.config.js
│   └── page2
│       ├── index.js
│       └── page.config.js
└── webpack.config.js
```

```javascript
// webpack.config.js

const MultiPagePlugin = require('multi-page-plugin');
const path = require('path');

module.exports = {
    plugins: [
        new MultiPagePlugin({
            context: path.resolve(__dirname, 'src')
        })
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].js'
    }
}
```

编译后得到 dist 如下：
```
dist
├── js
│   ├── page~page1_v1.js
│   ├── page~page1_v2.js
│   └── page~page2.js
├── page1
│   ├── v1.html
│   └── v2.html
└── page2.html
```

## 参数选项
```javascript
new MultiPagePlugin({
    // 页面配置文件名称
    //
    // 默认值：'page.config.js'
    configFile: 'custom.config.js',

    // 一个绝对路径
    // 在当前目录下遍历查找所有的页面配置文件
    //
    // 默认值：process.cwd()
    context: path.resolve(__dirname, 'src'),

    // 页面入口点名称前缀
    //
    // default: 'page~'
    chunkNamePrefix: 'custom~',

    // 页面配置默认选项
    config: {
        // 页面入口点文件名称（相对与页面配置文件所在目录）
        //
        // 默认值：'index.js'
        entry: 'main.js',

        // 跳过创建当前页面
        //
        // 默认值：false
        deprecated: true,

        // 创建 html-webpack-plugin 对象时所传递的选项
        //
        // 详细查看：https://github.com/jantimon/html-webpack-plugin#options
        //
        htmlOptions: {
            // multi-page-plugin 会默认设置 filename, excludeChunks, chunksSortMode
            ...
        }
    }
})
```

## 页面配置文件
当前页面配置选项，需要导出一个对象，选项同 MultiPagePlugin 构造参数 options.config。
