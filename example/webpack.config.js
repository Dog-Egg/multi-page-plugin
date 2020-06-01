const MultiPagePlugin = require('..')
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'production',
  plugins: [
    new CleanWebpackPlugin(),
    new MultiPagePlugin({ context: path.resolve(__dirname, 'src/pages') })
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].min.js'
  },
  optimization: {
    runtimeChunk: 'single'
  }
}
