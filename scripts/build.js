const buildJs = require('./build-js')
const buildStyles = require('./build-styles')

const build = async () => {
  const env = process.env.NODE_ENV || 'development'
  const outputDir = env === 'development' ? 'build' : 'package'
  return Promise.all([buildJs(), buildStyles(outputDir)]).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

build()
