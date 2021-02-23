const path = require('path')
const fs = require('fs-extra')
const { rollup } = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const { babel } = require('@rollup/plugin-babel')
const { minify } = require('terser')
const config = require('./config')

const banner = require('./banner')(config.name)

const outDir = process.env.NODE_ENV === 'production' ? 'package' : 'build'

async function buildUMD() {
  const bundle = await rollup({
    input: path.resolve(__dirname, '../src/index.js'),
    plugins: [
      commonjs({ transformMixedEsModules: true }),
      nodeResolve(),
      babel({ babelHelpers: 'bundled' }),
    ],
  })
  const { output } = await bundle.write({
    strict: true,
    name: config.name,
    format: 'umd',
    file: path.resolve(__dirname, `../${outDir}/${config.outputName}.js`),
    sourcemap: false,
    banner,
  })
  const result = output[0]
  const { code, map } = await minify(result.code, {
    sourceMap: {
      content: result.map,
      filename: `dom7.min.js`,
      url: `dom7.min.js.map`,
    },
    output: {
      preamble: banner,
    },
  })
  await Promise.all([
    fs.writeFile(
      path.resolve(__dirname, `../${outDir}/${config.outputName}.min.js`),
      code
    ),
    fs.writeFile(
      path.resolve(__dirname, `../${outDir}/${config.outputName}.min.js.map`),
      map
    ),
  ])
}

async function buildModule(
  format = 'esm',
  postfix = '',
  external = config.external
) {
  const bundle = await rollup({
    input: path.resolve(__dirname, '../src/index.js'),
    plugins: [
      commonjs({ transformMixedEsModules: true }),
      nodeResolve(),
      babel({ babelHelpers: 'bundled' }),
    ],
    external,
    onwarn() {
      // eslint-disable-next-line
      return
    },
  })
  await bundle.write({
    strict: true,
    format,
    file: path.resolve(
      __dirname,
      `../${outDir}/${config.outputName}${postfix}.js`
    ),
    sourcemap: false,
    banner,
  })
}

module.exports = () => {
  try {
    buildUMD()
    buildModule('esm', '.esm')
    buildModule('cjs', '.cjs')
    buildModule('esm', '.esm.browser', [])
    buildModule('cjs', '.cjs.browser', [])
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err)
  }
}
