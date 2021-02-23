const sass = require('sass')
const fs = require('fs-extra')
const globby = require('globby')
const path = require('path')
const banner = require('./banner')()

const buildCss = async (minified, outputDir) => {
  const file = path.resolve(__dirname, '../src/assets/index.scss')

  const result = await sass.renderSync({
    file,
  })

  await fs.ensureDir(`./${outputDir}`)

  await fs.writeFile(`./${outputDir}/index.css`, `${banner}\n${result.css}`)
}

module.exports = async (outputDir) => {
  const env = process.env.NODE_ENV || 'development'
  await buildCss(env !== 'development', outputDir)
  if (env === 'development') {
    return
  }

  const files = await globby(['assets/**/**.scss'], {
    cwd: path.resolve(__dirname, '../src'),
  })

  await Promise.all(
    files.map(async (file) => {
      const distFilePath = path.resolve(__dirname, `../${outputDir}`, file)
      const srcFilePath = path.resolve(__dirname, '../src', file)
      const distFileContent = await fs.readFile(srcFilePath, 'utf-8')
      await fs.ensureDir(path.dirname(distFilePath))
      await fs.writeFile(distFilePath, distFileContent)
    })
  )
}
