const test = require('ava')
const MultiPagePlugin = require('..')
const path = require('path')
const webpack = require('webpack')

test('Find configuration files', t => {
  const files1 = new MultiPagePlugin({ context: __dirname }).findConfigFiles()
  t.is(files1.length, 3)
  files1.forEach(f => {
    t.regex(f, /\/.*\/page.config.js$/)
  })

  const files2 = new MultiPagePlugin({ context: path.resolve(__dirname, 'pages/page1') }).findConfigFiles()
  t.is(files2.length, 2)

  const files3 = new MultiPagePlugin({ configFile: 'p.config.js' }).findConfigFiles()
  t.deepEqual(files3, [path.resolve(__dirname, 'pages/page1/v2/p.config.js')])

  t.throws(
    () => new MultiPagePlugin({ context: 'page' }).findConfigFiles(),
    { instanceOf: Error, message: 'The provided context "page" is not an absolute path!' }
  )
})

test('Check HTML filename', t => {
  const instance = new MultiPagePlugin()
  t.notThrows(() => instance.checkHtmlFilename('index.html'))
  t.throws(() => instance.checkHtmlFilename('index.html'), { message: 'Duplicated HTML filename: "index.html"' })
  t.notThrows(() => instance.checkHtmlFilename('page.html'))
})

test('Entry & HtmlOptions', t => {
  const instance = new MultiPagePlugin({
    context: path.resolve(__dirname, 'pages'),
    config: {
      htmlOptions: {
        title: 'Title'
      }
    }
  })

  const entry = instance.getEntry()
  t.is(Object.keys(entry).length, 3)
  t.regex(entry['page~page1_v1'], new RegExp('/.*/pages/page1/v1/index.js$'))
  t.regex(entry['page~page1_v2'], new RegExp('/.*/pages/page1/v2/index.js$'))
  t.regex(entry['page~page2'], new RegExp('/.*/pages/page2/index.js$'))

  const htmlPluginOptions = instance.getHtmlPluginOptions()[1]
  t.is(htmlPluginOptions.title, 'Title2')
  t.is(htmlPluginOptions.filename, 'page1/v2.html')
  t.deepEqual(htmlPluginOptions.excludeChunks, ['page~page1_v1', 'page~page2'])
  t.deepEqual(['page~1', 'page~2', 'main'].sort(htmlPluginOptions.chunksSortMode), ['main', 'page~1', 'page~2'])
})

test('Webpack test', t => {
  const compiler = webpack({ entry: { main: './src' } })
  new MultiPagePlugin({ context: __dirname }).apply(compiler)
  t.is(Object.keys(compiler.options.entry).length, 4)
  t.is(compiler.options.plugins.length, 2)
})
