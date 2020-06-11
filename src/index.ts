import * as path from 'path'
import * as webpack from "webpack"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as FileHound from 'filehound'
import * as _ from 'lodash'
import {matcher} from "./lib/chunksorter"

interface Options {
    context?: string
    configFile?: string
    chunkNamePrefix?: string
    config?: PageConfig
}

interface PageConfig {
    entry?: string
    deprecated?: boolean
    htmlOptions?: HtmlWebpackPlugin.Options
}

interface ProcessedPageConfig {
    entrypoint: string
    chunkName: string
    htmlOptions: HtmlWebpackPlugin.Options
}

class MultiPagePlugin implements webpack.Plugin {
    private readonly context: string
    private readonly configFile: string
    private readonly chunkNamePrefix: string
    private _configs?: ProcessedPageConfig[]
    private readonly htmlFilenames: string[] = []

    constructor(options?: Options) {
        this.context = options?.context || process.cwd()
        this.configFile = options?.configFile || 'page.config.js'
        this.chunkNamePrefix = options?.chunkNamePrefix || 'page~'
    }

    get entry(): webpack.Entry {
        const entry = {}
        this.configs.forEach(i => {
            entry[i.chunkName] = i.entrypoint
        })
        return entry
    }

    apply(compiler: webpack.Compiler) {
        // check
        this.configs.forEach(i => {
            this.checkHtmlFilename(i.htmlOptions.filename || 'index.html')
        })

        // plugin
        this.getHtmlWebpackPluginOptions().forEach(o => {
            const plugin = new HtmlWebpackPlugin(o)
            if (compiler.options.plugins === undefined) {
                compiler.options.plugins = [plugin]
            } else {
                compiler.options.plugins.push(plugin)
            }
        })
    }

    private checkHtmlFilename(filename: string) {
        if (this.htmlFilenames.includes(filename)) {
            throw new Error(`Duplicated HTML filename: "${filename}"`)
        } else {
            this.htmlFilenames.push(filename)
        }
    }

    private findConfigFiles(): string[] {
        if (!path.isAbsolute(this.context)) {
            throw new Error(`The provided context "${this.context}" is not an absolute path!`)
        }
        return FileHound.create().path(this.context).match(this.configFile).findSync()
    }

    private getProcessedPageConfigs(): ProcessedPageConfig[] {
        const arr: ProcessedPageConfig[] = []
        const configFiles = this.findConfigFiles()
        configFiles.forEach(f => {
            const config: PageConfig = require(f)
            if (config.deprecated) return
            const nameArray = path.relative(this.context, f).split(path.sep).slice(0, -1)
            arr.push({
                entrypoint: path.join(f, '..', config.entry || 'index.js'),
                chunkName: this.chunkNamePrefix + (nameArray.join('_') || 'index'),
                htmlOptions: {
                    ...config.htmlOptions,
                    filename: config.htmlOptions?.filename || `${nameArray.join('/').toLowerCase() || 'index'}.html`
                }
            })
        })
        return arr
    }

    private get configs(): ProcessedPageConfig[] {
        if (!this._configs) {
            this._configs = this.getProcessedPageConfigs()
        }
        return this._configs
    }

    private getHtmlWebpackPluginOptions(): HtmlWebpackPlugin.Options[] {
        return this.configs.map(c => {
            const options = _.cloneDeep(c.htmlOptions)
            options.excludeChunks = this.configs
                .map(c => c.chunkName)
                .filter(i => i !== c.chunkName)
                .concat(options.excludeChunks || [])
            options.chunksSortMode = options.chunksSortMode || matcher([
                new RegExp(`^(?!${this.chunkNamePrefix})`),
                new RegExp(`^${this.chunkNamePrefix}`)
            ])

            return options
        })
    }
}

export = MultiPagePlugin
