module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['airbnb-base', 'prettier', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  // add your custom rules here
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'no-console': 'off',
    'no-continue': 'off',
  },
  parserOptions: {
    sourceType: 'module',
  },
}
