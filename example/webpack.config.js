const MultiPagePlugin = require('..')
const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

const multiPagePlugin = new MultiPagePlugin({
    context: path.resolve(__dirname, 'src/pages')
})

module.exports = {
    mode: 'production',
    entry: multiPagePlugin.entry,
    plugins: [
        new CleanWebpackPlugin(),
        multiPagePlugin
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].min.js'
    },
    optimization: {
        runtimeChunk: 'single'
    }
}
