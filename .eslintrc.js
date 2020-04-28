module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module',
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: ['airbnb-base', 'plugin:vue/recommended'],
  plugins: [
    'html'
  ],
  settings: {
    // 'import/ignore': [
    //   'wasm/',
    // ],
    // 'import/resolver': {
    //   'webpack': {
    //     'config': 'build/webpack.base.babel.js'
    //   }
    // }
  },
  rules: {
    "no-plusplus": 0,
    // 'import/extensions': ['error', 'always', {
    //   'js': 'never',
    //   'vue': 'never'
    // }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
