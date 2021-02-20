module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['prettier', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  // add your custom rules here
  rules: {},
  parserOptions: {
    sourceType: 'module',
  },
}
