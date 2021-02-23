const fs = require('fs')
const path = require('path')
const buildJs = require('./build-js')
const buildStyles = require('./build-styles')

const env = process.env.NODE_ENV || 'development'
const outputDir = env === 'development' ? 'build' : 'package'
console.log('Watching file changes ...')

let watchTimeout
fs.watch(
  path.resolve(__dirname, '../src'),
  { recursive: true },
  (eventType, fileName) => {
    clearTimeout(watchTimeout)
    watchTimeout = setTimeout(() => {
      if (fileName.includes('.css') || fileName.includes('.scss')) {
        console.log('Building styles')
        buildStyles(outputDir).then(() => {
          console.log('Building styles DONE')
        })
      } else if (fileName.includes('.js')) {
        console.log('Building JS')
        buildJs()
      }
    }, 100)
  }
)
