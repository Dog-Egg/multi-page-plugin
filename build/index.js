"use strict";
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FileHound = require("filehound");
const _ = require("lodash");
const chunksorter_1 = require("./lib/chunksorter");
class MultiPagePlugin {
    constructor(options) {
        this.htmlFilenames = [];
        this.context = (options === null || options === void 0 ? void 0 : options.context) || process.cwd();
        this.configFile = (options === null || options === void 0 ? void 0 : options.configFile) || 'page.config.js';
        this.chunkNamePrefix = (options === null || options === void 0 ? void 0 : options.chunkNamePrefix) || 'page~';
    }
    get entry() {
        const entry = {};
        this.configs.forEach(i => {
            entry[i.chunkName] = i.entrypoint;
        });
        return entry;
    }
    apply(compiler) {
        // check
        this.configs.forEach(i => {
            this.checkHtmlFilename(i.htmlOptions.filename || 'index.html');
        });
        // plugin
        this.getHtmlWebpackPluginOptions().forEach(o => {
            const plugin = new HtmlWebpackPlugin(o);
            if (compiler.options.plugins === undefined) {
                compiler.options.plugins = [plugin];
            }
            else {
                compiler.options.plugins.push(plugin);
            }
        });
    }
    checkHtmlFilename(filename) {
        if (this.htmlFilenames.includes(filename)) {
            throw new Error(`Duplicated HTML filename: "${filename}"`);
        }
        else {
            this.htmlFilenames.push(filename);
        }
    }
    findConfigFiles() {
        if (!path.isAbsolute(this.context)) {
            throw new Error(`The provided context "${this.context}" is not an absolute path!`);
        }
        return FileHound.create().path(this.context).match(this.configFile).findSync();
    }
    getProcessedPageConfigs() {
        const arr = [];
        const configFiles = this.findConfigFiles();
        configFiles.forEach(f => {
            var _a;
            const config = require(f);
            if (config.deprecated)
                return;
            const nameArray = path.relative(this.context, f).split(path.sep).slice(0, -1);
            arr.push({
                entrypoint: path.join(f, '..', config.entry || 'index.js'),
                chunkName: this.chunkNamePrefix + (nameArray.join('_') || 'index'),
                htmlOptions: Object.assign(Object.assign({}, config.htmlOptions), { filename: ((_a = config.htmlOptions) === null || _a === void 0 ? void 0 : _a.filename) || `${nameArray.join('/').toLowerCase() || 'index'}.html` })
            });
        });
        return arr;
    }
    get configs() {
        if (!this._configs) {
            this._configs = this.getProcessedPageConfigs();
        }
        return this._configs;
    }
    getHtmlWebpackPluginOptions() {
        return this.configs.map(c => {
            const options = _.cloneDeep(c.htmlOptions);
            options.excludeChunks = this.configs
                .map(c => c.chunkName)
                .filter(i => i !== c.chunkName)
                .concat(options.excludeChunks || []);
            options.chunksSortMode = options.chunksSortMode || chunksorter_1.matcher([
                new RegExp(`^(?!${this.chunkNamePrefix})`),
                new RegExp(`^${this.chunkNamePrefix}`)
            ]);
            return options;
        });
    }
}
module.exports = MultiPagePlugin;
