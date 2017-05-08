
const preset = require('babel-preset-esfp')
const babel = require('babel-core')
const through = require('through2')

module.exports = esfp

function esfp (filename, options) {
  const collection = []

  return through(function (buf, enc, done) {
    collection.push(buf)
    done()
  }, function () {
    const src = Buffer.concat(collection).toString('utf8')
    try {
      const res = babel.transform(src, {
        babelrc: false,
        compact: false,
        sourceMaps: options._flags.debug && 'inline',
        filename,
        plugins: preset.plugins
      })
      this.push(res.code)
      this.push(null)
    } catch (err) {
      this.emit('error', err)
    }
  })
}

