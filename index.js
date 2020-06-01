const _ = require('lodash')
const path = require('path')
const FileHound = require('filehound')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { matcher } = require('./lib/chunksorter')

class MultiPagePlugin {
  constructor (options) {
    this.options = _.merge({
      context: process.cwd(),
      configFile: 'page.config.js',
      chunkNamePrefix: 'page~',
      config: {
        entry: 'index.js',
        deprecated: false,
        htmlOptions: {}
      }
    }, options)
    this._configs = null
    this._htmlFilenames = []
  }

  apply (compiler) {
    const configs = this.getPageConfigs()

    // check
    configs.forEach(p => {
      this.checkHtmlFilename(p.htmlOptions.filename)
    })

    // entry
    const entry = this.getEntry()
    if (_.isPlainObject(compiler.options.entry)) {
      _.merge(compiler.options.entry, entry)
    } else {
      compiler.options.entry = entry
    }

    // plugin
    this.getHtmlPluginOptions().forEach(o => {
      const plugin = new HtmlWebpackPlugin(o)
      if (_.has(compiler.options, 'plugins')) {
        compiler.options.plugins.push(plugin)
      } else {
        compiler.options.plugins = []
      }
    })
  }

  findConfigFiles () {
    const context = this.options.context
    if (!path.isAbsolute(context)) {
      throw new Error(`The provided context "${context}" is not an absolute path!`)
    }
    return FileHound.create()
      .paths(context)
      .match(this.options.configFile)
      .findSync()
  }

  checkHtmlFilename (name) {
    if (this._htmlFilenames.includes(name)) {
      throw new Error(`Duplicated HTML filename: "${name}"`)
    } else {
      this._htmlFilenames.push(name)
    }
  }

  getPageConfigs () {
    const arr = []
    const configFiles = this.findConfigFiles()
    configFiles.forEach(f => {
      const config = _.merge({}, this.options.config, require(f))
      if (config.deprecated) return

      const nameArray = path.relative(this.options.context, f).split(path.sep).slice(0, -1)
      arr.push({
        entry: path.join(f, '..', config.entry),
        chunkName: this.options.chunkNamePrefix + (nameArray.join('_') || 'main'),
        htmlOptions: {
          ...config.htmlOptions,
          filename: config.htmlOptions.filename || `${nameArray.join('/').toLowerCase() || 'index'}.html`
        }
      })
    })
    return arr
  }

  get configs () {
    if (!this._configs) {
      this._configs = this.getPageConfigs()
    }
    return this._configs
  }

  getEntry () {
    const entry = {}
    this.configs.forEach(c => {
      entry[c.chunkName] = c.entry
    })
    return entry
  }

  getHtmlPluginOptions () {
    return this.configs.map(c => {
      const options = _.cloneDeep(c.htmlOptions)
      options.excludeChunks = this.configs
        .map(c => c.chunkName)
        .filter(i => i !== c.chunkName)
        .concat(options.excludeChunks || [])
      options.chunksSortMode = options.chunksSortMode || matcher([
        new RegExp(`^(?!${this.options.chunkNamePrefix})`),
        new RegExp(`^${this.options.chunkNamePrefix}`)
      ])

      return options
    })
  }
}

module.exports = MultiPagePlugin
